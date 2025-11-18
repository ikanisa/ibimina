"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";

export function EmailLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setFormError(null);

    startTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const friendly =
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password"
            : signInError.message;
        setFormError(friendly);
        error(friendly);
        return;
      }

      const redirectTo = searchParams.get("next") || "/admin";
      setMessage("Signed in successfully. Redirecting…");
      success("Signed in successfully");
      router.replace(redirectTo);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-neutral-300"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-kigali"
          placeholder="staff@sacco.rw"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-neutral-300"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-kigali"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      {formError && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{formError}</p>
      )}
      {message && (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-kigali px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-lg shadow-kigali/40 transition hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
