"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BilingualText } from "@/components/common/bilingual-text";

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      setMessage("Success! Redirecting to dashboard…");
      router.refresh();
      router.push("/dashboard");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2 text-left">
        <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          <BilingualText primary="Staff email" secondary="Imeli y'umukozi" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          placeholder="staff@sacco.rw / staff@ikimina.rw"
        />
      </div>
      <div className="space-y-2 text-left">
        <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          <BilingualText primary="Password" secondary="Ijambo ry'ibanga" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-kigali py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-glass transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
