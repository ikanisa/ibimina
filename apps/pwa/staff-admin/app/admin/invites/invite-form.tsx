"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useId } from "react";

export type InviteFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: InviteFormState = {
  status: "idle",
  message: "",
};

export function InviteForm({
  action,
}: {
  action: (state: InviteFormState, formData: FormData) => Promise<InviteFormState>;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const emailId = useId();
  const saccoId = useId();
  const roleId = useId();

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800" htmlFor={emailId}>
            Staff email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            placeholder="staff@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800" htmlFor={saccoId}>
            SACCO ID
          </label>
          <input
            id={saccoId}
            name="saccoId"
            required
            autoComplete="organization"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            placeholder="UUID of SACCO"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800" htmlFor={roleId}>
            Role
          </label>
          <select
            id={roleId}
            name="role"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            defaultValue="SACCO_STAFF"
          >
            <option value="SACCO_STAFF">SACCO staff</option>
            <option value="SACCO_MANAGER">SACCO manager</option>
          </select>
        </div>
      </div>

      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={
            state.status === "success"
              ? "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <p className="text-xs text-gray-600" aria-live="polite">
          Invites expire after 7 days. Resend if a staff member misses theirs.
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-70"
    >
      {pending ? "Sending…" : "Send invite"}
    </button>
  );
}
