"use client";

import { useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function FirstLoginResetPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const search = useSearchParams();
  const email = search?.get("email") ?? undefined;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message ?? "Failed to update password");
        return;
      }
      // Clear the pw_reset_required flag in user metadata
      await supabase.auth.updateUser({ data: { pw_reset_required: false } as any });
      router.replace("/dashboard");
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-0">Set a new password</h1>
      <p className="mb-6 text-neutral-2">
        {email ? `Welcome ${email}. ` : "Welcome. "}For your security, please set a new password to continue.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          />
        </div>
        {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="interactive-scale w-full rounded-xl bg-kigali py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-glass disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

