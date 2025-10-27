import { z } from "zod";
import { createServiceClient, parseJwt } from "../_shared/mod.ts";
import { enforceIdentityRateLimit } from "../_shared/rate-limit.ts";
import { resolveReference } from "../_shared/payments.ts";
import { encryptField, hashField, maskMsisdn } from "../_shared/crypto.ts";
import { ensureAccount, getAccountBalance, postToLedger } from "../_shared/ledger.ts";
import {
  getIdempotentResponse,
  hashPayload,
  saveIdempotentResponse,
} from "../_shared/idempotency.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { recordMetric } from "../_shared/metrics.ts";
import { errorCorsResponse, jsonCorsResponse, preflightResponse } from "../_shared/http.ts";

const requestSchema = z.object({
  saccoId: z.string().uuid(),
  msisdn: z.string().min(8),
  amount: z.coerce.number().int().positive(),
  currency: z.string().length(3).default("RWF"),
  txnId: z.string().min(3),
  occurredAt: z.string().datetime({ offset: true }),
  reference: z.string().min(3).optional(),
  sourceId: z.string().uuid().optional(),
});

const loadProfile = async (supabase: ReturnType<typeof createServiceClient>, userId: string) => {
  const { data, error } = await supabase
    .schema("app")
    .from("user_profiles")
    .select("sacco_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};

const computeBalances = async (
  supabase: ReturnType<typeof createServiceClient>,
  saccoId: string,
  ikiminaId: string | null
) => {
  if (!ikiminaId) {
    return null;
  }

  const accountId = await ensureAccount(supabase, "IKIMINA", ikiminaId, saccoId);
  const balance = await getAccountBalance(supabase, accountId);
  return {
    accountId,
    balance,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse({ "access-control-allow-methods": "POST,OPTIONS" });
  }

  if (req.method !== "POST") {
    return errorCorsResponse("Method not allowed", 405);
  }

  try {
    const idempotencyKey = req.headers.get("x-idempotency-key");
    if (!idempotencyKey) {
      return errorCorsResponse("Missing x-idempotency-key header", 422);
    }

    const payload = requestSchema.parse(await req.json());

    const auth = parseJwt(req.headers.get("authorization"));
    const supabase = createServiceClient();

    let actingRole = auth.role ?? null;
    let actingSaccoId: string | null = payload.saccoId;
    const actorId = auth.userId ?? "service-role";

    if (auth.userId) {
      const allowed = await enforceIdentityRateLimit(supabase, auth.userId, "/payments/apply", {
        maxHits: 20,
        windowSeconds: 60,
      });

      if (!allowed) {
        return errorCorsResponse("Rate limit exceeded", 429);
      }

      const profile = await loadProfile(supabase, auth.userId);
      actingRole = (profile?.role as string | null) ?? actingRole;
      actingSaccoId = (profile?.sacco_id as string | null) ?? actingSaccoId;

      if (actingRole !== "SYSTEM_ADMIN") {
        if (!profile?.sacco_id) {
          return errorCorsResponse("Profile missing SACCO assignment", 403);
        }

        if (profile.sacco_id !== payload.saccoId) {
          return errorCorsResponse("Forbidden", 403);
        }
      }
    }

    const identityKey = auth.userId ?? "service-role";
    const requestHash = hashPayload({
      ...payload,
      actingSaccoId,
      actorId,
    });

    const cached = await getIdempotentResponse<Record<string, unknown>>(
      supabase,
      identityKey,
      idempotencyKey
    );
    if (cached && cached.request_hash === requestHash) {
      return jsonCorsResponse({
        ...cached.response,
        idempotent: true,
      });
    }

    const msisdnEncrypted = await encryptField(payload.msisdn);
    const msisdnHash = await hashField(payload.msisdn);
    const msisdnMasked = maskMsisdn(payload.msisdn) ?? payload.msisdn;

    const resolution = await resolveReference(supabase, payload.reference, actingSaccoId);

    const paymentBody = {
      channel: "MANUAL",
      sacco_id: resolution.saccoId ?? payload.saccoId,
      ikimina_id: resolution.ikiminaId,
      member_id: resolution.memberId,
      msisdn: msisdnMasked,
      msisdn_encrypted: msisdnEncrypted,
      msisdn_hash: msisdnHash,
      msisdn_masked: msisdnMasked,
      amount: payload.amount,
      currency: payload.currency,
      txn_id: payload.txnId,
      reference: payload.reference,
      occurred_at: payload.occurredAt,
      status: resolution.status,
      source_id: payload.sourceId ?? null,
      confidence: 1,
    };

    const upsert = await supabase
      .schema("app")
      .from("payments")
      .upsert(paymentBody, {
        onConflict: "txn_id,amount,occurred_at",
      })
      .select("id, status, sacco_id, ikimina_id, member_id")
      .single();

    if (upsert.error) {
      throw upsert.error;
    }

    const payment = upsert.data;

    if (payment.status === "POSTED" && payment.ikimina_id) {
      await postToLedger(supabase, {
        id: payment.id as string,
        sacco_id: payment.sacco_id as string,
        ikimina_id: payment.ikimina_id as string,
        member_id: payment.member_id as string | null,
        amount: payload.amount,
        currency: payload.currency,
        txn_id: payload.txnId,
      });
    }

    const balances = await computeBalances(
      supabase,
      (payment.sacco_id as string) ?? payload.saccoId,
      payment.ikimina_id as string | null
    );

    const responsePayload = {
      paymentId: payment.id,
      status: payment.status,
      balances,
    };

    await saveIdempotentResponse(
      supabase,
      identityKey,
      idempotencyKey,
      requestHash,
      responsePayload
    );

    await writeAuditLog(supabase, {
      action: "PAYMENT_APPLY",
      saccoId: payment.sacco_id as string,
      entity: "PAYMENT",
      entityId: payment.id as string,
      actorId: auth.userId ?? null,
      diff: {
        amount: payload.amount,
        reference: payload.reference ?? null,
        status: payment.status,
      },
    });

    await recordMetric(supabase, "payment_apply", 1, {
      saccoId: payment.sacco_id,
      status: payment.status,
    });

    return jsonCorsResponse({
      ...responsePayload,
      idempotent: false,
    });
  } catch (error) {
    console.error("payments-apply error", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    const message = error instanceof z.ZodError ? "Invalid payload" : "Unhandled error";
    return errorCorsResponse(message, status);
  }
});
