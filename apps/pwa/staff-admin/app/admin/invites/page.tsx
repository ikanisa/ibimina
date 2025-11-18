import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InviteForm, type InviteFormState } from "./invite-form";

interface InviteRow {
  id: string;
  token: string;
  status: string;
  invitee_msisdn: string | null;
  created_at: string | null;
  group_id: string;
  ibimina: { name: string | null } | null;
}

async function inviteStaff(
  prevState: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  "use server";

  const email = (formData.get("email") as string | null)?.trim();
  const saccoId = (formData.get("saccoId") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim() || "SACCO_STAFF";

  if (!email || !saccoId) {
    return { status: "error", message: "Email and SACCO ID are required." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.functions.invoke("invite-user", {
    body: {
      email,
      saccoId,
      role,
    },
  });

  if (error) {
    return { status: "error", message: error.message ?? "Unable to send the invite." };
  }

  revalidatePath("/admin/invites");
  return { status: "success", message: "Invitation sent successfully." };
}

export default async function StaffInvitesPage() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("group_invites")
    .select("id, token, status, invitee_msisdn, created_at, group_id, ibimina(name)")
    .order("created_at", { ascending: false })
    .limit(25);

  const invites: InviteRow[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Staff invites</h2>
        <p className="text-sm text-gray-600">
          Send invitations to SACCO staff and confirm delivery with clear feedback and focusable
          controls.
        </p>
      </div>

      <InviteForm action={inviteStaff} />

      <section aria-label="Recent invites" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">Recent activity</h3>
          <p className="text-xs text-gray-600">Showing the 25 most recent invites.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Group
                </th>
                <th scope="col" className="px-4 py-3">
                  Invitee
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="bg-white">
                  <td className="px-4 py-3 text-gray-900">
                    {invite.ibimina?.name ?? invite.group_id}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{invite.invitee_msisdn ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                      {invite.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {invite.created_at ? new Date(invite.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/invite/${invite.token}`}
                      className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!invites.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-600" colSpan={5}>
                    No invites issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
