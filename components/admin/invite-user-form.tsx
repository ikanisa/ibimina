"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SaccoSearchCombobox, type SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { useToast } from "@/providers/toast-provider";
import { BilingualText } from "@/components/common/bilingual-text";

const ROLES: Array<Database["public"]["Enums"]["app_role"]> = ["SYSTEM_ADMIN", "SACCO_STAFF"];

export function InviteUserForm() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Database["public"]["Enums"]["app_role"]>("SACCO_STAFF");
  const [sacco, setSacco] = useState<SaccoSearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { success, error: toastError } = useToast();

  const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;

  const notifyError = (en: string, rw: string) => toastError(toBilingual(en, rw));
  const notifySuccess = (en: string, rw: string) => success(toBilingual(en, rw));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (role !== "SYSTEM_ADMIN" && !sacco) {
      const msg = "Select a SACCO for this role";
      setError(toBilingual(msg, "Hitamo SACCO kuri izi nshingano"));
      notifyError(msg, "Hitamo SACCO kuri izi nshingano");
      return;
    }

    startTransition(async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email,
          role,
          saccoId: role === "SYSTEM_ADMIN" ? null : sacco?.id ?? null,
        },
      });

      if (error) {
        console.error(error);
        const msg = error.message ?? "Invite failed";
        setError(toBilingual(msg, "Ubutumire bwanze"));
        notifyError(msg, "Ubutumire bwanze");
        return;
      }

      const successEn = data?.temporaryPassword
        ? `Invitation sent. Temporary password: ${data.temporaryPassword}`
        : "Invitation sent successfully";
      const successRw = data?.temporaryPassword
        ? `Ubutumire bwoherejwe. Ijambobanga ry'agateganyo: ${data.temporaryPassword}`
        : "Ubutumire bwoherejwe neza";
      setMessage(toBilingual(successEn, successRw));
      notifySuccess("Invitation sent to staff", "Ubutumire bwoherejwe ku mukozi");
      setEmail("");
      setRole("SACCO_STAFF");
      setSacco(null);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-2 space-y-2">
        <BilingualText
          primary="Invited users receive a one-time password via email; they must sign in with that password and change it immediately."
          secondary="Abakoresha batumiwe bahabwa ijambobanga ry'igihe rimwe binyujijwe muri email, bakinjira bakaryahindura ako kanya."
          secondaryClassName="text-[10px] text-neutral-3"
        />
        <BilingualText
          primary="Only system administrators or SACCO staff roles are available; assign a SACCO when inviting staff."
          secondary="Ushobora guhitamo gusa System Admin cyangwa SACCO Staff; hitamo SACCO igihe utumiye umukozi."
          secondaryClassName="text-[10px] text-neutral-3"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          <BilingualText primary="Email" secondary="Imeli" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          placeholder="staff@sacco.rw / staff@ikimina.rw"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          <BilingualText primary="Role" secondary="Inshingano" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof ROLES)[number])}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {role !== "SYSTEM_ADMIN" && <SaccoSearchCombobox value={sacco} onChange={setSacco} />}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="interactive-scale w-full rounded-xl bg-kigali py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-glass disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
