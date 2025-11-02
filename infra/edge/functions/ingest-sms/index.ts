import { registry } from "../../providers/index.ts";
import type { NormalizedTxn } from "../../providers/types.ts";
import { logRedacted } from "../../shared/logging.ts";
import {
  getServiceClient,
  readEnv
} from "../../shared/supabase.ts";

async function verifyHmac(
  secret: string,
  raw: Uint8Array,
  sig: string | null
): Promise<boolean> {
  if (!sig) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, hexToBuf(sig), raw);
}

function hexToBuf(hex: string): Uint8Array {
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return buffer;
}

function buildRow(
  orgId: string,
  normalized: NormalizedTxn,
  decoded: ReturnType<typeof registry.decoder.decode>
) {
  return {
    org_id: orgId,
    momo_txn_id: normalized.txnId,
    payer_msisdn: normalized.payerMsisdn,
    amount: normalized.amount,
    ts: normalized.ts,
    raw_ref: normalized.rawRef ?? null,
    decoded_district: decoded?.district ?? null,
    decoded_sacco: decoded?.sacco ?? null,
    decoded_group: decoded?.group ?? null,
    decoded_member: decoded?.member ?? null,
    match_status: "UNALLOCATED",
    notes: "sms-ingest"
  };
}

export default {
  async fetch(req: Request): Promise<Response> {
    const secret = readEnv("HMAC_SMS_SECRET");
    if (!secret) {
      return new Response("server misconfigured", { status: 500 });
    }

    const rawBody = new Uint8Array(await req.arrayBuffer());
    const ok = await verifyHmac(secret, rawBody, req.headers.get("x-signature"));
    if (!ok) return new Response("bad signature", { status: 401 });

    const payload = JSON.parse(new TextDecoder().decode(rawBody)) as {
      org_id: string;
      country_iso2: string;
      telco: string;
      sms: string;
    };

    const key = `${payload.country_iso2.toLowerCase()}.${payload.telco.toLowerCase()}.sms`;
    const adapter = registry.sms[key];
    if (!adapter) return new Response("no adapter", { status: 400 });

    const normalized = adapter.parseSms(payload.sms);
    if (!normalized) return new Response("no match", { status: 422 });

    const decoded = registry.decoder.decode(normalized.rawRef ?? "");

    const client = await getServiceClient();
    const row = buildRow(payload.org_id, normalized, decoded);
    const { error } = await client.from("allocations").insert(row);
    if (error) {
      logRedacted("sms-ingest-error", {
        reason: error.message,
        org_id: payload.org_id,
        txn_id: normalized.txnId,
        raw_ref: normalized.rawRef,
        payer_msisdn: normalized.payerMsisdn
      });
      return new Response(error.message, { status: 500 });
    }

    logRedacted("sms-ingest", {
      org_id: payload.org_id,
      txn_id: normalized.txnId,
      raw_ref: normalized.rawRef,
      payer_msisdn: normalized.payerMsisdn
    });

    return new Response(
      JSON.stringify({ ok: true, normalized, decoded }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
