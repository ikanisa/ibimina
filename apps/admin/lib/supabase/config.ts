export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseConfigStatus = SupabaseConfig & {
  hasUrl: boolean;
  hasAnonKey: boolean;
};

function readSupabaseEnv(): SupabaseConfigStatus {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  return {
    url,
    anonKey,
    hasUrl: url.length > 0,
    hasAnonKey: anonKey.length > 0,
  };
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  return readSupabaseEnv();
}

export function requireSupabaseConfig(context: string): SupabaseConfig {
  if (process.env.AUTH_E2E_STUB === "1") {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stub.supabase.local",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "stub-anon-key",
    };
  }

  const status = readSupabaseEnv();

  if (!status.hasUrl || !status.hasAnonKey) {
    console.error("supabase.config.missing", {
      context,
      hasUrl: status.hasUrl,
      hasAnonKey: status.hasAnonKey,
    });

    const error = new Error(
      "Supabase environment variables are not configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (for example, .env.local or your process manager).",
    );
    error.name = "SupabaseConfigError";
    throw error;
  }

  return {
    url: status.url,
    anonKey: status.anonKey,
  };
}
