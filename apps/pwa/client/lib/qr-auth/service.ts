import crypto from "node:crypto";
import { logError, logInfo } from "@/lib/observability/logger";
import { enforceRateLimit, hashRateLimitKey } from "@/lib/rate-limit";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/lib/supabase/types";
import { hashQrToken, signQrToken, verifyQrToken } from "./tokens";

const QR_TOKEN_TTL_SECONDS = 120;
const APPROVAL_TOKEN_TTL_SECONDS = 300;

type AuthQrSessionRow = Database["public"]["Tables"]["auth_qr_sessions"]["Row"];

type CreateSessionInput = {
  ip: string;
  userAgent?: string | null;
};

type ExchangeInput = {
  token: string;
  accessToken: string;
  refreshToken: string;
  deviceId?: string | null;
  fingerprint?: string | null;
  ip: string;
};

type PollInput = {
  token: string;
};

export const createQrAuthSession = async ({ ip, userAgent }: CreateSessionInput) => {
  const supabase = createSupabaseServiceRoleClient("qr-auth:create");
  await enforceRateLimit(hashRateLimitKey("qr-auth:create", ip), {
    maxHits: 10,
    windowSeconds: 300,
  });

  const now = Date.now();
  const expiresAt = new Date(now + QR_TOKEN_TTL_SECONDS * 1000);
  const sessionId = crypto.randomUUID();
  const challenge = crypto.randomBytes(32).toString("hex");
  const token = signQrToken({
    sid: sessionId,
    challenge,
    exp: Math.floor(expiresAt.getTime() / 1000),
  });
  const tokenHash = hashQrToken(token);

  const { error } = await supabase.from("auth_qr_sessions").insert({
    session_id: sessionId,
    challenge,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    token_expires_at: expiresAt.toISOString(),
    signature: tokenHash,
    ip_address: ip,
    browser_fingerprint: userAgent?.slice(0, 255) ?? null,
  });

  if (error) {
    logError("qr-auth.session.create_failed", { error });
    throw new Error("session_create_failed");
  }

  logInfo("qr-auth.session.created", { sessionId, ip });

  return { token, sessionId, expiresAt: expiresAt.toISOString() };
};

export const exchangeQrAuthSession = async ({
  token,
  accessToken,
  refreshToken,
  deviceId,
  fingerprint,
  ip,
}: ExchangeInput) => {
  const payload = verifyQrToken(token);
  const tokenHash = hashQrToken(token);
  await enforceRateLimit(hashRateLimitKey("qr-auth:exchange", ip, payload.sid), {
    maxHits: 5,
    windowSeconds: 180,
  });

  const supabase = createSupabaseServiceRoleClient("qr-auth:exchange");

  const { data: existing, error: existingError } = await supabase
    .from("auth_qr_sessions")
    .select("*")
    .eq("session_id", payload.sid)
    .eq("challenge", payload.challenge)
    .eq("signature", tokenHash)
    .single();

  if (existingError || !existing) {
    logError("qr-auth.exchange.session_not_found", {
      error: existingError,
      sessionId: payload.sid,
    });
    throw new Error("session_not_found");
  }

  const nowIso = new Date().toISOString();

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    await supabase
      .from("auth_qr_sessions")
      .update({ status: "expired" })
      .eq("id", existing.id)
      .in("status", ["pending", "approved"]);
    throw new Error("session_expired");
  }

  if (existing.status !== "pending") {
    throw new Error("session_already_processed");
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authUser?.user) {
    logError("qr-auth.exchange.invalid_token", { error: authError });
    throw new Error("invalid_access_token");
  }

  const approvalExpiry = new Date(Date.now() + APPROVAL_TOKEN_TTL_SECONDS * 1000).toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("auth_qr_sessions")
    .update({
      status: "approved",
      authenticated_at: nowIso,
      token_expires_at: approvalExpiry,
      device_id: deviceId ?? null,
      browser_fingerprint: fingerprint?.slice(0, 255) ?? existing.browser_fingerprint,
      ip_address: ip || existing.ip_address,
      web_access_token: accessToken,
      web_refresh_token: refreshToken,
      staff_id: authUser.user.id,
    })
    .eq("id", existing.id)
    .eq("status", "pending")
    .select()
    .single();

  if (updateError || !updated) {
    logError("qr-auth.exchange.update_failed", { error: updateError });
    throw new Error("session_update_failed");
  }

  logInfo("qr-auth.session.approved", { sessionId: payload.sid, userId: authUser.user.id });

  return { status: "approved" as const };
};

export const pollQrAuthSession = async ({ token }: PollInput) => {
  const payload = verifyQrToken(token);
  const tokenHash = hashQrToken(token);
  const supabase = createSupabaseServiceRoleClient("qr-auth:poll");

  const { data: existing, error } = await supabase
    .from("auth_qr_sessions")
    .select("*")
    .eq("session_id", payload.sid)
    .eq("challenge", payload.challenge)
    .eq("signature", tokenHash)
    .single();

  if (error || !existing) {
    logError("qr-auth.poll.not_found", { error });
    return { status: "not_found" as const };
  }

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    await supabase
      .from("auth_qr_sessions")
      .update({ status: "expired" })
      .eq("id", existing.id)
      .in("status", ["pending", "approved"]);
    return { status: "expired" as const };
  }

  if (existing.status !== "approved") {
    return {
      status: existing.status as AuthQrSessionRow["status"],
      expiresAt: existing.expires_at,
    };
  }

  if (!existing.web_access_token || !existing.web_refresh_token) {
    logError("qr-auth.poll.tokens_missing", { id: existing.id, status: existing.status });
    return { status: "pending" as const };
  }

  const session = {
    access_token: existing.web_access_token,
    refresh_token: existing.web_refresh_token,
  } satisfies { access_token: string; refresh_token: string };

  const { error: consumeError } = await supabase
    .from("auth_qr_sessions")
    .update({
      status: "consumed",
      web_access_token: null,
      web_refresh_token: null,
      signature: tokenHash,
    })
    .eq("id", existing.id)
    .eq("status", "approved");

  if (consumeError) {
    logError("qr-auth.poll.consume_failed", { error: consumeError });
  }

  return {
    status: "approved" as const,
    session,
    expiresAt: existing.token_expires_at ?? existing.expires_at,
  };
};
