import Link from "next/link";
import { logError } from "@/lib/observability/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CountryRow } from "@/lib/types/multicountry";

export default async function CountriesPage() {
  const supa = createSupabaseAdminClient();
  const { data, error } = await supa.from("countries").select("id, iso2, iso3, name, is_active");

  if (error) {
    logError("Failed to load countries:", error);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Countries</h1>
        <Link
          href="/countries/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add Country
        </Link>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load countries: {error.message}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">ISO2</th>
                <th className="px-4 py-3 font-semibold">ISO3</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c: CountryRow) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.iso2}</td>
                  <td className="px-4 py-3">{c.iso3}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        c.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/countries/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      Configure
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!data ||
            (data.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No countries configured yet. Add your first country to get started.
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
