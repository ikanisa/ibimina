import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Stub for resolveSupabaseEnvironment - using env vars directly
const resolveSupabaseEnvironment = ({ url, anonKey, accessToken }: any) => ({
  url: url || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  accessToken,
});

export type CreateClientOptions = {
  url?: string;
  anonKey?: string;
  accessToken?: string;
};

export const createSupabaseClient = ({
  url,
  anonKey,
  accessToken,
}: CreateClientOptions = {}): SupabaseClient => {
  const environment = resolveSupabaseEnvironment({ url, anonKey, accessToken });

  const client = createClient(environment.url, environment.anonKey, {
    auth: environment.accessToken
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
