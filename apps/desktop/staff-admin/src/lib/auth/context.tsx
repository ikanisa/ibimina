import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { deleteSecureCredentials } from "@/lib/tauri/commands";

interface Profile {
  id: string;
  user_id: string;
  sacco_id: string | null;
  mfa_enabled: boolean;
  role: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  mfaRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  navigateTo: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  const navigateTo = useCallback((path: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single();
      if (error) { console.error("Failed to fetch profile:", error); return null; }
      return data as unknown as Profile;
    } catch (error) { console.error("Error fetching profile:", error); return null; }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) { const p = await fetchProfile(s.user.id); setProfile(p); if (p?.mfa_enabled) setMfaRequired(true); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, s) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) { const p = await fetchProfile(s.user.id); setProfile(p); if (p?.mfa_enabled) setMfaRequired(true); }
      else { setProfile(null); setMfaRequired(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const p = await fetchProfile(data.user.id); setProfile(p);
      if (p?.mfa_enabled) { setMfaRequired(true); navigateTo("/mfa-challenge"); }
      else { navigateTo("/dashboard"); }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut(); await deleteSecureCredentials();
    setUser(null); setProfile(null); setSession(null); setMfaRequired(false); navigateTo("/login");
  };

  const refreshSession = async () => {
    const { data: { session: s } } = await supabase.auth.refreshSession();
    setSession(s); setUser(s?.user ?? null);
  };

  return <AuthContext.Provider value={{ user, profile, session, loading, mfaRequired, signIn, signOut, refreshSession, navigateTo }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
