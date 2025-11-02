import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseEnvironment, type ResolveSupabaseEnvironmentOptions } from "@ibimina/lib";

export type CreateClientOptions = {
  url?: string;
  anonKey?: string;
  accessToken?: string;
};

const throwMissingEnv = (name: string): never => {
  throw new Error(`Missing Supabase configuration: ${name}`);
};

export const createSupabaseClient = ({
  url,
  anonKey,
  accessToken,
}: CreateClientOptions = {}): SupabaseClient => {
  const resolvedUrl =
    url ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolvedAnonKey =
    anonKey ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const safeUrl = resolvedUrl ?? throwMissingEnv("SUPABASE_URL");
  const safeAnonKey = resolvedAnonKey ?? throwMissingEnv("SUPABASE_ANON_KEY");

  const client = createClient(safeUrl, safeAnonKey, {
    auth: accessToken
      ? {
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: {
            getItem: async () => null,
            setItem: async () => {},
            removeItem: async () => {},
          },
        }
      : {
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
  });

  if (environment.accessToken) {
    void client.auth.setSession({
      access_token: environment.accessToken,
      refresh_token: environment.accessToken,
    });
  }

  return client;
};

export type DatabaseClient = ReturnType<typeof createSupabaseClient>;
