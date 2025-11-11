import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function CountryConfigPage({ params }: { params: { id: string } }) {
  const supa = createSupabaseAdminClient();
  const { data: country } = await supa
    .from("countries")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const { data: cfg } = await supa
    .from("country_config")
    .select("*")
    .eq("country_id", params.id)
    .maybeSingle();

  const { data: telcos } = await supa
    .from("telco_providers")
    .select("id, name, ussd_pattern")
    .eq("country_id", params.id);

  if (!country) {
    return (
      <div className="p-6">
        <div className="text-red-500">Country not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configure {country.name}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Languages, telcos, features, KYC, legal pages, reference format.
        </p>
      </div>

      <div className="space-y-6">
        {/* Country Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Country Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1">{country.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ISO Code</dt>
              <dd className="mt-1">
                {country.iso2} / {country.iso3}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</dt>
              <dd className="mt-1">{country.currency_code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timezone</dt>
              <dd className="mt-1">{country.timezone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Default Locale
              </dt>
              <dd className="mt-1">{country.default_locale}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    country.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {country.is_active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Telco Providers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Telco Providers</h2>
          {telcos && telcos.length > 0 ? (
            <div className="space-y-3">
              {telcos.map((telco: any) => (
                <div
                  key={telco.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <div className="font-medium">{telco.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {telco.ussd_pattern}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No telco providers configured</p>
          )}
        </div>

        {/* Country Configuration */}
        {cfg ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {cfg.languages?.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Enabled Features
                </dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {cfg.enabled_features?.map((feature: string) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Reference Format
                </dt>
                <dd className="mt-1 font-mono text-sm">{cfg.reference_format}</dd>
              </div>
              {cfg.settlement_notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Settlement Notes
                  </dt>
                  <dd className="mt-1 text-sm">{cfg.settlement_notes}</dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400">
              No configuration found for this country.
            </p>
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
