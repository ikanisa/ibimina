import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PartnerConfigPage({ params }: { params: { id: string }}) {
  const supa = createSupabaseAdminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("*, countries(name, iso2)")
    .eq("id", params.id)
    .maybeSingle();
  
  const { data: cfg } = await supa
    .from("partner_config")
    .select("*")
    .eq("org_id", params.id)
    .maybeSingle();
  
  const { data: telcos } = await supa
    .from("telco_providers")
    .select("id, name")
    .eq("country_id", org?.country_id);

  if (!org) {
    return (
      <div className="p-6">
        <div className="text-red-500">Partner organization not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configure {org.name}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Merchant code, telcos, languages, features, reference prefix, contacts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Organization Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1">{org.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="mt-1">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {org.type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</dt>
              <dd className="mt-1">
                {org.countries?.name} ({org.countries?.iso2})
              </dd>
            </div>
            {org.district_code && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">District Code</dt>
                <dd className="mt-1">{org.district_code}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Available Telcos */}
        {telcos && telcos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Available Telco Providers</h2>
            <div className="flex flex-wrap gap-2">
              {telcos.map((telco: any) => (
                <span 
                  key={telco.id} 
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-full"
                >
                  {telco.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Partner Configuration */}
        {cfg ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Partner Configuration</h2>
            <dl className="space-y-4">
              {cfg.merchant_code && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Merchant Code</dt>
                  <dd className="mt-1 font-mono text-sm">{cfg.merchant_code}</dd>
                </div>
              )}
              {cfg.reference_prefix && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference Prefix</dt>
                  <dd className="mt-1 font-mono text-sm">{cfg.reference_prefix}</dd>
                </div>
              )}
              {cfg.enabled_features && cfg.enabled_features.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enabled Features</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {cfg.enabled_features.map((feature: string) => (
                        <span key={feature} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
              {cfg.language_pack && cfg.language_pack.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Language Pack</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {cfg.language_pack.map((lang: string) => (
                        <span key={lang} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
              {cfg.contact && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</dt>
                  <dd className="mt-1 space-y-1 text-sm">
                    {cfg.contact.phone && <div>Phone: {cfg.contact.phone}</div>}
                    {cfg.contact.email && <div>Email: {cfg.contact.email}</div>}
                    {cfg.contact.hours && <div>Hours: {cfg.contact.hours}</div>}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400">No partner configuration found.</p>
          </div>
        )}

        {/* TODO: Add form for editing configuration */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Configuration editing UI will be implemented in a future update. 
            For now, configurations can be managed directly in the database.
          </p>
        </div>
      </div>
    </div>
  );
}
