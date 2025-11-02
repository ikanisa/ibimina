import { z } from "zod";
import { createServiceClient, errorResponse, jsonResponse, parseJwt } from "../_shared/mod.ts";
import { enforceIdentityRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { serveWithObservability } from "../_shared/observability.ts";

const requestSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

serveWithObservability("admin-reset-mfa", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST,OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const auth = parseJwt(req.headers.get("authorization"));
    if (!auth.userId) {
      return errorResponse("Missing identity", 401);
    }

    const supabase = createServiceClient();

    const profile = await supabase
      .schema("app")
      .from("user_profiles")
      .select("role, sacco_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    const role = profile.data?.role ?? auth.role;
    if (role !== "SYSTEM_ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const allowed = await enforceIdentityRateLimit(supabase, auth.userId, "/admin/reset-mfa", {
      maxHits: 10,
      windowSeconds: 60,
    });

    if (!allowed) {
      return errorResponse("Rate limit exceeded", 429);
    }

    const payload = requestSchema.parse(await req.json());

    const { data: targetUser, error: targetError } = await supabase
      .schema("auth")
      .from("users")
      .select("email")
      .eq("id", payload.userId)
      .maybeSingle();

    if (targetError) {
      console.error("admin-reset-mfa target lookup failed", targetError);
      return errorResponse("Failed to lookup user", 500);
    }

    if (!targetUser?.email) {
      return errorResponse("User email required for reset notification", 400);
    }

    await supabase.schema("app").from("devices_trusted").delete().eq("user_id", payload.userId);

    await supabase
      .schema("auth")
      .from("mfa_factors")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.userId);

    await supabase
      .schema("auth")
      .from("users")
      .update({
        mfa_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.userId);

    const notificationBody = [
      "Hello,",
      "",
      "Your SACCO+ multi-factor authentication has been reset by a system administrator.",
      "",
      `Reason provided: ${payload.reason}`,
      "",
      "You will need to enrol in MFA again the next time you sign in.",
      "",
      "If this was unexpected, please contact support immediately.",
      "",
      "— SACCO+ Security",
    ].join("\n");

    await supabase.from("notification_queue").insert({
      event: "MFA_RESET",
      channel: "EMAIL",
      payment_id: null,
      payload: {
        userId: payload.userId,
        email: targetUser.email,
        reason: payload.reason,
        subject: "Your SACCO+ MFA has been reset",
        body: notificationBody,
      },
      scheduled_for: new Date().toISOString(),
    });

    await writeAuditLog(supabase, {
      action: "MFA_RESET",
      saccoId: null,
      entity: "USER",
      entityId: payload.userId,
      actorId: auth.userId,
      diff: {
        reason: payload.reason,
      },
    });

    return jsonResponse({
      userId: payload.userId,
      status: "RESET",
    });
  } catch (error) {
    console.error("admin-reset-mfa error", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    const message = error instanceof z.ZodError ? "Invalid payload" : "Unhandled error";
    return errorResponse(message, status);
  }
});
