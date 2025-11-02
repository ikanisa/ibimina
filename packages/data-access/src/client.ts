import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseEnvironment, type ResolveSupabaseEnvironmentOptions } from "@ibimina/lib";

export type CreateClientOptions = ResolveSupabaseEnvironmentOptions;

export const createSupabaseClient = (options: CreateClientOptions = {}): SupabaseClient => {
  const environment = resolveSupabaseEnvironment(options);

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
