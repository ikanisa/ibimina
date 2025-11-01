import { createContext, ReactNode, useContext, useMemo } from "react";
import { createSupabaseClient, type DatabaseClient } from "@ibimina/data-access";

const SupabaseContext = createContext<DatabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createSupabaseClient(), []);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export const useSupabase = () => {
  const value = useContext(SupabaseContext);

  if (!value) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }

  return value;
};
