/**
 * Admin MFA Reset API Route
 *
 * Allows system administrators to reset multi-factor authentication for a user.
 * This is a privileged operation used when a user loses access to their MFA device
 * (authenticator app, passkey, etc.) and cannot complete the sign-in flow.
 *
 * Security:
 * - Restricted to SYSTEM_ADMIN role only
 * - All resets are logged in audit_logs for compliance
 * - Requires a documented reason for the reset
 *
 * Operation:
 * 1. Locates user by ID or email
 * 2. Resets MFA flags (mfa_enabled = false)
 * 3. Clears TOTP secret and backup codes
 * 4. Deletes all trusted devices
 * 5. Sets default MFA method to EMAIL only
 * 6. Creates audit log entry with reason
 *
 * @route POST /api/admin/mfa/reset
 * @access SYSTEM_ADMIN only
 *
 * @example
 * POST /api/admin/mfa/reset
 * {
 *   "userId": "uuid",
 *   "reason": "Lost authenticator device on field assignment"
 * }
 *
 * // Or by email
 * {
 *   "email": "staff@sacco.rw",
 *   "reason": "Device stolen, emergency reset requested"
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";

import { logAudit } from "@/lib/audit";
import { guardAdminAction } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeError } from "@/lib/errors";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { CONSTANTS } from "@/lib/constants";

type ResetPayload = {
  userId?: string;
  email?: string;
  reason: string;
};

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 5 minutes for MFA reset (sensitive operation)
  const clientIP = await getClientIP();
  const rateLimitResponse = await checkRateLimit(
    `admin:mfa-reset:${clientIP}`,
    CONSTANTS.RATE_LIMIT.AUTH
  );
  if (rateLimitResponse) return rateLimitResponse;

  // Guard: Only SYSTEM_ADMIN can reset MFA
  const guard = await guardAdminAction(
    {
      action: "admin_mfa_reset",
      reason: "Only system administrators can reset MFA.",
      logEvent: "admin_mfa_reset_denied",
      clientFactory: createSupabaseAdminClient,
    },
    () => NextResponse.json({ error: "forbidden" }, { status: 403 })
  );

  if (guard.denied) {
    return guard.result;
  }

  try {
    const { supabase, user } = guard.context;
    const body = (await request.json().catch(() => null)) as ResetPayload | null;
    if (!body || (!body.userId && !body.email) || !body.reason) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Locate target user by id or email
    type TargetRow = {
      id: string;
      email: string | null;
      mfa_enabled: boolean | null;
      mfa_secret_enc: string | null;
    };

    const query = supabase.from("users").select("id, email, mfa_enabled, mfa_secret_enc").limit(1);

    const { data: foundById } = body.userId ? await query.eq("id", body.userId) : { data: null };

    const { data: foundByEmail } =
      !foundById?.[0] && body.email
        ? await supabase
            .from("users")
            .select("id, email, mfa_enabled, mfa_secret_enc")
            .eq("email", body.email)
            .limit(1)
        : { data: null };

    const target = ((foundById ?? foundByEmail)?.[0] as TargetRow | undefined) ?? null;
    if (!target) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Reset all MFA settings to defaults
    // This clears TOTP secrets, backup codes, and enrollment timestamps
    const updatePayload = {
      mfa_enabled: false,
      mfa_secret_enc: null,
      mfa_enrolled_at: null,
      mfa_backup_hashes: [],
      mfa_methods: [CONSTANTS.MFA_METHODS.EMAIL], // Email OTP remains available
      failed_mfa_count: 0,
      last_mfa_step: null,
      last_mfa_success_at: null,
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", target.id);

    if (updateError) {
      logError("admin mfa reset: update failed", updateError);
      const sanitized = sanitizeError(updateError);
      return NextResponse.json(
        { error: sanitized.message, code: sanitized.code },
        { status: 500 }
      );
    }

    // Clear all trusted devices to force fresh authentication
    const trustedDelete = await supabase.from("trusted_devices").delete().eq("user_id", target.id);
    if (trustedDelete.error) {
      logError("admin mfa reset: trusted devices delete failed", trustedDelete.error);
      const sanitized = sanitizeError(trustedDelete.error);
      return NextResponse.json(
        { error: sanitized.message, code: sanitized.code },
        { status: 500 }
      );
    }

    // Create immutable audit log entry for compliance tracking
    await logAudit({
      action: "MFA_RESET",
      entity: "USER",
      entityId: target.id,
      diff: { reason: body.reason, actor: user.id },
    });

    return NextResponse.json({ success: true, userId: target.id });
  } catch (error) {
    logError("admin mfa reset: unexpected error", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 }
    );
  }
}
