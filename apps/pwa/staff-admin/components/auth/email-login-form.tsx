"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/src/lib/supabaseClient";
import { useSupabaseSession } from "@/lib/hooks/use-supabase-session";

export function EmailLoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { session, state } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("pending");
      setMessage(null);

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Unable to send login code.");
        return;
      }

      setStatus("sent");
      setMessage("Check your email for the login link. It expires shortly.");
    },
    [email, supabase]
  );

  if (state === "ready" && session) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2" htmlFor="login-email">
        <span className="text-sm font-medium text-neutral-12">Work email</span>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-6 bg-neutral-1 px-3 py-2 focus-within:border-atlas-blue">
          <Mail className="h-4 w-4 text-neutral-8" aria-hidden />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.gov.rw"
            className="w-full bg-transparent text-sm outline-none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "pending"}
          />
        </div>
      </label>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-atlas-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-atlas-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={status === "pending"}
      >
        {status === "pending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {status === "sent" ? "Link sent" : "Send login link"}
      </button>

      {message && (
        <p className="text-sm text-neutral-12" role={status === "error" ? "alert" : "status"}>
          {message}
        </p>
      )}
    </form>
  );
}
