import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CreateClientOptions = {
  url?: string;
  anonKey?: string;
  accessToken?: string;
};

const throwMissingEnv = (name: string) => {
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

  if (!resolvedUrl) {
    throwMissingEnv("SUPABASE_URL");
  }

  if (!resolvedAnonKey) {
    throwMissingEnv("SUPABASE_ANON_KEY");
  }

  const client = createClient(resolvedUrl, resolvedAnonKey, {
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

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });
  }

  return client;
};

export type DatabaseClient = ReturnType<typeof createSupabaseClient>;
