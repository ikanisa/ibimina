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

type ExportPayload = {
  bucket: string;
  path: string;
  expires_in_seconds?: number;
  audit_actor: string;
};

export default {
  async fetch(req: Request): Promise<Response> {
    const secret = readEnv("HMAC_EXPORT_SECRET");
    if (!secret) return new Response("server misconfigured", { status: 500 });

    const rawBody = new Uint8Array(await req.arrayBuffer());
    const ok = await verifyHmac(secret, rawBody, req.headers.get("x-signature"));
    if (!ok) return new Response("bad signature", { status: 401 });

    const payload = JSON.parse(new TextDecoder().decode(rawBody)) as ExportPayload;
    const expiresIn = payload.expires_in_seconds ?? 60 * 10;

    const client = await getServiceClient();
    const { data, error } = await client
      .storage
      .from(payload.bucket)
      .createSignedUrl(payload.path, expiresIn, { download: "allocations.csv" });

    if (error || !data?.signedUrl) {
      logRedacted("allocation-export-error", {
        reason: error?.message ?? "unknown",
        bucket: payload.bucket,
        path: payload.path
      });
      return new Response(error?.message ?? "cannot sign url", { status: 500 });
    }

    logRedacted("allocation-export", {
      bucket: payload.bucket,
      path: payload.path,
      audit_actor: payload.audit_actor
    });

    return new Response(JSON.stringify({ ok: true, signed_url: data.signedUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
