import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CountryRow } from "@/lib/types/multicountry";
import { PageHeader, EmptyState, ErrorState } from "@ibimina/ui";
import { Globe } from "lucide-react";

export default async function CountriesPage() {
  const supa = createSupabaseAdminClient();
  const { data, error } = await supa.from("countries").select("id, iso2, iso3, name, is_active");

  if (error) {
    console.error("Failed to load countries:", error);
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Countries"
        description="Manage countries and their settings"
        actions={
          <Link
            href="/countries/new"
            className="rounded-xl bg-atlas-blue px-4 py-2 text-sm font-semibold text-white shadow-atlas transition-colors hover:bg-atlas-blue-light"
          >
            Add Country
          </Link>
        }
      />

      {error ? (
        <ErrorState
          title="Failed to load countries"
          description="An error occurred while loading the countries list. Please try again."
          error={error.message}
          onRetry={() => window.location.reload()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No countries configured yet"
          description="Add your first country to get started with regional configuration"
          icon={<Globe className="h-6 w-6" />}
          action={
            <Link
              href="/countries/new"
              className="rounded-xl bg-atlas-blue px-4 py-2 text-sm font-semibold text-white shadow-atlas transition-colors hover:bg-atlas-blue-light"
            >
              Add Country
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-neutral-200">Name</th>
                <th className="px-4 py-3 font-semibold text-neutral-200">ISO2</th>
                <th className="px-4 py-3 font-semibold text-neutral-200">ISO3</th>
                <th className="px-4 py-3 font-semibold text-neutral-200">Status</th>
                <th className="px-4 py-3 font-semibold text-neutral-200"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((c: CountryRow) => (
                <tr
                  key={c.id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-neutral-0">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-200">{c.iso2}</td>
                  <td className="px-4 py-3 text-neutral-200">{c.iso3}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        c.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/countries/${c.id}`}
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
