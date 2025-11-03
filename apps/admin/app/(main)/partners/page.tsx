import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader, EmptyState, ErrorState } from "@ibimina/ui";
import { Building2 } from "lucide-react";

export default async function PartnersPage() {
  const supa = createSupabaseAdminClient();
  const { data: orgs, error } = await supa
    .from("organizations")
    .select("id, name, type, country_id, countries(name, iso2)")
    .neq("type", "DISTRICT");

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Partners (SACCO/MFI/BANK)"
        description="Configure partner organizations and their settings"
      />

      {error ? (
        <ErrorState
          title="Failed to load partners"
          description="An error occurred while loading the partner organizations. Please try again."
          error={error.message}
          onRetry={() => window.location.reload()}
        />
      ) : !orgs || orgs.length === 0 ? (
        <EmptyState
          title="No partner organizations found"
          description="Create a new partner organization to get started"
          icon={<Building2 className="h-6 w-6" />}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-neutral-200">Name</th>
                <th className="px-4 py-3 font-semibold text-neutral-200">Type</th>
                <th className="px-4 py-3 font-semibold text-neutral-200">Country</th>
                <th className="px-4 py-3 font-semibold text-neutral-200"></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o: any) => (
                <tr
                  key={o.id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-neutral-0">{o.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-atlas-blue/20 text-atlas-blue">
                      {o.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-200">
                    {o.countries?.name} ({o.countries?.iso2})
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/partners/${o.id}`}
                      className="text-atlas-blue hover:text-atlas-blue-light transition-colors hover:underline"
                    >
                      Configure
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
