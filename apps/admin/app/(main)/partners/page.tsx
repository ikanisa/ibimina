import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PartnersPage() {
  const supa = createSupabaseAdminClient();
  const { data: orgs, error } = await supa
    .from("organizations")
    .select("id, name, type, country_id, countries(name, iso2)")
    .neq("type", "DISTRICT");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Partners (SACCO/MFI/BANK)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure partner organizations and their settings
        </p>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load partners: {error.message}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {orgs?.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">{o.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {o.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.countries?.name} ({o.countries?.iso2})
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      href={`/partners/${o.id}`} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      Configure
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!orgs || orgs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No partner organizations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
