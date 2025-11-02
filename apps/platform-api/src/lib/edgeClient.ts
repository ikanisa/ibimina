import { createHmac } from "node:crypto";

export interface EdgeRetryOptions {
  attempts?: number;
  backoffMs?: number;
  factor?: number;
}

export interface EdgeInvocationOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: EdgeRetryOptions;
}

const encoder = new TextEncoder();

export const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildSignature = (
  secret: string,
  timestamp: string,
  method: string,
  pathname: string,
  payload: Uint8Array
) => {
  const hmac = createHmac("sha256", secret);
  hmac.update(encoder.encode(timestamp));
  hmac.update(encoder.encode(`${method.toUpperCase()}:${pathname}`));
  hmac.update(payload);
  return hmac.digest("hex");
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function invokeEdge(path: string, options: EdgeInvocationOptions = {}) {
  const baseUrl =
    process.env.EDGE_FUNCTION_BASE_URL ?? `${requireEnv("SUPABASE_URL")}/functions/v1/`;
  const secret = requireEnv("HMAC_SHARED_SECRET");
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const method = options.method?.toUpperCase() ?? (options.body ? "POST" : "GET");
  const payload = options.body ? encoder.encode(JSON.stringify(options.body)) : new Uint8Array();
  const attempts = Math.max(1, options.retry?.attempts ?? 1);
  const baseBackoff = Math.max(0, options.retry?.backoffMs ?? 250);
  const factor = Math.max(1, options.retry?.factor ?? 2);

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
    const timestamp = new Date().toISOString();
    const signature = buildSignature(secret, timestamp, method, url.pathname, payload);

    try {
      const response = await fetch(url, {
        method,
        body: payload.length ? payload : undefined,
        signal: controller.signal,
        headers: {
          "content-type": options.body ? "application/json" : "application/json",
          "x-timestamp": timestamp,
          "x-signature": signature,
          ...options.headers,
        },
      });

      const text = await response.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = text;
      }

      if (!response.ok) {
        const errorMessage =
          typeof (json as any)?.error === "string" ? (json as any).error : response.statusText;
        throw new Error(`Edge invocation failed (${response.status}): ${errorMessage}`);
      }

      return json;
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) {
        throw error;
      }

      const delay = baseBackoff * factor ** (attempt - 1);
      if (delay > 0) {
        await wait(delay);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Edge invocation failed");
}
