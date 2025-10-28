import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["SYSTEM_ADMIN", "SACCO_MANAGER", "SACCO_STAFF", "SACCO_VIEWER"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface InviteRequestBody {
  email: string;
  role: AllowedRole;
  saccoId?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: requester },
      error: requesterError,
    } = await userClient.auth.getUser();

    if (requesterError || !requester) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: requesterProfile, error: profileError } = await serviceClient
      .from("users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (profileError || requesterProfile?.role !== "SYSTEM_ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: InviteRequestBody = await req.json();
    const email = body?.email?.trim().toLowerCase();
    const role = body?.role;
    const saccoId = body?.saccoId || null;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role !== "SYSTEM_ADMIN" && !saccoId) {
      return new Response(JSON.stringify({ error: "SACCO assignment required for this role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const temporaryPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: false,
    });

    if (createError || !created.user) {
      console.error("User creation failed", createError);
      throw createError || new Error("Unable to create user");
    }

    const { error: updateError } = await serviceClient
      .from("users")
      .update({ role, sacco_id: saccoId })
      .eq("id", created.user.id);

    if (updateError) {
      console.error("Failed to update user profile", updateError);
      throw updateError;
    }

    const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      console.warn("Failed to send invitation email", inviteError);
    }

    await serviceClient
      .schema("app")
      .from("audit_logs")
      .insert({
        actor: requester.id,
        action: "INVITE_USER",
        entity: "users",
        entity_id: created.user.id,
        diff: { email, role, sacco_id: saccoId },
      });

    return new Response(
      JSON.stringify({
        success: true,
        userId: created.user.id,
        temporaryPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Invite user error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
