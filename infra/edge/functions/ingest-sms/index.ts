// deno-lint-ignore-file no-explicit-any
import { registry } from "../../providers/index.ts";

function verifyHmac(secret: string, raw: Uint8Array, sig: string | null) {
  if (!sig) return false;
  const key = crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign","verify"]);
  return key.then(k => crypto.subtle.verify("HMAC", k, hexToBuf(sig), raw)).then((ok)=> ok);
}
function hexToBuf(hex: string){ const b = new Uint8Array(hex.length/2); for(let i=0;i<b.length;i++) b[i] = parseInt(hex.substr(i*2,2),16); return b; }

export default {
  async fetch(req: Request): Promise<Response> {
    const secret = Deno.env.get("HMAC_SHARED_SECRET");
    if (!secret) {
      return new Response("server misconfigured", { status: 500 });
    }

    const bodyRaw = new Uint8Array(await req.arrayBuffer());
    const ok = await verifyHmac(secret, bodyRaw, req.headers.get("x-signature"));
    if (!ok) return new Response("bad signature", { status: 401 });

    const { org_id, country_iso2, telco, sms } = JSON.parse(new TextDecoder().decode(bodyRaw));
    const key = `${(country_iso2||"").toLowerCase()}.${(telco||"").toLowerCase()}.sms`;
    const adapter = registry.sms[key];
    if (!adapter) return new Response("no adapter", { status: 400 });

    const norm = adapter.parseSms(sms);
    if (!norm) return new Response("no match", { status: 422 });

    const decoded = registry.decoder.decode(norm.rawRef || "");
    // Insert into allocations with UNALLOCATED by default; set org_id, country_id via trigger.
    // Use Supabase REST or PostgREST RPC; in Deno you can call postgres directly or supabase-js via ESM.
    // Example payload:
    const row = {
      org_id,
      sacco_name: "", // optional label
      momo_txn_id: norm.txnId,
      payer_msisdn: norm.payerMsisdn,
      amount: norm.amount,
      ts: norm.ts,
      raw_ref: norm.rawRef || null,
      decoded_district: decoded?.district || null,
      decoded_sacco: decoded?.sacco || null,
      decoded_group: decoded?.group || null,
      decoded_member: decoded?.member || null,
      match_status: "UNALLOCATED",
      notes: "sms-ingest"
    };

    // TODO: insert row to allocations (via Supabase client with service role)
    // const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // const { error } = await supa.from("allocations").insert(row);
    // if (error) return new Response(error.message, { status: 500 });

    console.log("SMS ingested (adapter):", { row, normalized: norm, decoded });

    return new Response(JSON.stringify({ ok: true, normalized: norm, decoded }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
