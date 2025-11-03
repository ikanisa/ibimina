import { createContext, ReactNode, useContext, useMemo } from "react";
import { createSupabaseClient, type DatabaseClient } from "@ibimina/data-access";
import { useAppStore } from "./store";

const SupabaseContext = createContext<DatabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const authToken = useAppStore((state) => state.authToken);

  const client = useMemo(() => {
    if (authToken) {
      return createSupabaseClient({ accessToken: authToken });
    }

    return createSupabaseClient();
  }, [authToken]);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export const useSupabase = () => {
  const value = useContext(SupabaseContext);

  if (!value) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }

  return value;
};
