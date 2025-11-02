type InsertResult = Promise<{
  data?: unknown;
  error?: { message: string } | null;
}>;

type SignedUrlResult = Promise<{
  data?: { signedUrl: string } | null;
  error?: { message: string } | null;
}>;

export interface SupabaseServiceClientLike {
  from(table: string): {
    insert(values: unknown | unknown[]): InsertResult;
  };
  storage: {
    from(bucket: string): {
      createSignedUrl(
        path: string,
        expiresIn: number,
        options?: Record<string, unknown>
      ): SignedUrlResult;
    };
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __supabaseServiceClient__:
    | SupabaseServiceClientLike
    | undefined;
}

async function loadSupabaseFactory(): Promise<{
  createClient: (
    url: string,
    key: string,
    options?: Record<string, unknown>
  ) => SupabaseServiceClientLike;
}> {
  if (typeof globalThis.__supabaseServiceClient__ !== "undefined") {
    return {
      createClient: () => globalThis.__supabaseServiceClient__!
    };
  }

  if (typeof Deno !== "undefined" && "env" in Deno) {
    // Deno supports npm specifiers via the `npm:` prefix
    const mod = await import("npm:@supabase/supabase-js@2");
    return { createClient: mod.createClient };
  }

  const mod = await import("@supabase/supabase-js");
  return { createClient: mod.createClient };
}

function readEnv(key: string): string | undefined {
  if (typeof Deno !== "undefined" && "env" in Deno) {
    try {
      return Deno.env.get(key) ?? undefined;
    } catch (_) {
      // Deno env access can throw in non-server contexts; ignore.
    }
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export async function getServiceClient(): Promise<SupabaseServiceClientLike> {
  if (typeof globalThis.__supabaseServiceClient__ !== "undefined") {
    return globalThis.__supabaseServiceClient__;
  }

  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Supabase service credentials are not configured");
  }

  const { createClient } = await loadSupabaseFactory();
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "edge-service" } }
  });

  globalThis.__supabaseServiceClient__ = client;
  return client;
}

export function setServiceClientForTesting(
  client: SupabaseServiceClientLike | undefined
): void {
  globalThis.__supabaseServiceClient__ = client;
}

export { readEnv };
