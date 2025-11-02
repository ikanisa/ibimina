import { registry } from "../../providers/index.ts";
import { logRedacted } from "../../shared/logging.ts";
import { readEnv } from "../../shared/supabase.ts";

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

type DecodePayload = { raw_ref: string };

export default {
  async fetch(req: Request): Promise<Response> {
    const secret = readEnv("HMAC_REFERENCE_SECRET");
    if (!secret) return new Response("server misconfigured", { status: 500 });

    const rawBody = new Uint8Array(await req.arrayBuffer());
    const ok = await verifyHmac(secret, rawBody, req.headers.get("x-signature"));
    if (!ok) return new Response("bad signature", { status: 401 });

    const { raw_ref } = JSON.parse(new TextDecoder().decode(rawBody)) as DecodePayload;
    const decoded = registry.decoder.decode(raw_ref ?? "");
    if (!decoded) return new Response("no match", { status: 404 });

    logRedacted("reference-decode", { raw_ref });

    return new Response(JSON.stringify({ ok: true, decoded }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
