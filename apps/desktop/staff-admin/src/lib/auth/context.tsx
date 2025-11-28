"use client";

/**
 * Authentication context provider for desktop app
 * Manages user session, login/logout, and MFA state
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const router = useRouter();

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, user_id, sacco_id, mfa_enabled, role, full_name")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);

        // Check if MFA is required
        if (userProfile?.mfa_enabled) {
          // TODO: Check if MFA session is valid
          setMfaRequired(true);
        }
      }

      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);

        if (userProfile?.mfa_enabled) {
          setMfaRequired(true);
        }
      } else {
        setProfile(null);
        setMfaRequired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);

      // Check if MFA is required
      if (userProfile?.mfa_enabled) {
        setMfaRequired(true);
        router.push("/mfa-challenge");
      } else {
        router.push("/dashboard");
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await deleteSecureCredentials();
    setUser(null);
    setProfile(null);
    setSession(null);
    setMfaRequired(false);
    router.push("/login");
  };

  const refreshSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();
    setSession(session);
    setUser(session?.user ?? null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    mfaRequired,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
