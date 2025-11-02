import { registry } from "../../providers/index.ts";
import type { NormalizedTxn } from "../../providers/types.ts";
import { logRedacted } from "../../shared/logging.ts";
import { getServiceClient, readEnv } from "../../shared/supabase.ts";

async function verifyHmac(
  secret: string,
  raw: Uint8Array,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, hexToBuf(signature), raw);
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

type StatementPayload = {
  org_id: string;
  country_iso2: string;
  telco: string;
  rows: Record<string, string>[];
};

function mapRow(
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
    notes: "statement-ingest"
  };
}

export default {
  async fetch(req: Request): Promise<Response> {
    const secret = readEnv("HMAC_STATEMENT_SECRET");
    if (!secret) return new Response("server misconfigured", { status: 500 });

    const rawBody = new Uint8Array(await req.arrayBuffer());
    const signature = req.headers.get("x-signature");
    const ok = await verifyHmac(secret, rawBody, signature);
    if (!ok) return new Response("bad signature", { status: 401 });

    const payload = JSON.parse(new TextDecoder().decode(rawBody)) as StatementPayload;
    const key = `${payload.country_iso2.toLowerCase()}.${payload.telco.toLowerCase()}.statement`;
    const adapter = registry.statement[key];
    if (!adapter) return new Response("no adapter", { status: 400 });

    const client = await getServiceClient();
    const rowsToInsert = [] as Record<string, unknown>[];

    for (const row of payload.rows) {
      const normalized = adapter.parseRow(row);
      if (!normalized) continue;
      const decoded = registry.decoder.decode(normalized.rawRef ?? "");
      rowsToInsert.push(mapRow(payload.org_id, normalized, decoded));
    }

    if (!rowsToInsert.length) {
      return new Response("no rows", { status: 422 });
    }

    const { error } = await client.from("allocations").insert(rowsToInsert);
    if (error) {
      logRedacted("statement-ingest-error", {
        reason: error.message,
        count: rowsToInsert.length,
        org_id: payload.org_id
      });
      return new Response(error.message, { status: 500 });
    }

    logRedacted("statement-ingest", {
      org_id: payload.org_id,
      rows_ingested: rowsToInsert.length
    });

    return new Response(
      JSON.stringify({ ok: true, inserted: rowsToInsert.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
