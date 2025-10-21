import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { SaccoRegistryManager } from "@/components/admin/sacco-registry-manager";
import { FinancialInstitutionManager } from "@/components/admin/financial-institution-manager";
import { MomoCodeTable } from "@/components/admin/momo-code-table";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveTenantScope } from "@/lib/admin/scope";
import { isMissingRelationError } from "@/lib/supabase/errors";
import { Trans } from "@/components/common/trans";
import type { Database } from "@/lib/supabase/types";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";

interface SaccosPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function SaccosPage({ searchParams }: SaccosPageProps) {
  const { profile } = await requireUserAndProfile();
  const scope = resolveTenantScope(profile, searchParams);
  const supabase = await createSupabaseServerClient();

  let saccoQuery = supabase
    .schema("app")
    .from("saccos")
    .select("id, name, district, province, sector, status, email, category, logo_url, sector_code")
    .order("name", { ascending: true });

  if (!scope.includeAll && scope.saccoId) {
    saccoQuery = saccoQuery.eq("id", scope.saccoId);
  }

  const { data: saccoRows, error } = await saccoQuery;

  if (error) {
    throw error;
  }

  const saccos = (saccoRows ?? []) as Array<
    Pick<Database["app"]["Tables"]["saccos"]["Row"], "id" | "name" | "district" | "province" | "category" | "status" | "email" | "sector_code">
  >;

  const saccoOptions: SaccoSearchResult[] = saccos.map((row) => ({
    id: row.id,
    name: row.name ?? "Unnamed SACCO",
    district: row.district ?? "",
    province: row.province ?? "",
    category: row.category ?? "",
  }));

  let financialInstitutions: Database["app"]["Tables"]["financial_institutions"]["Row"][] = [];
  let momoCodes: Database["app"]["Tables"]["momo_codes"]["Row"][] = [];
  let districtMomoMap: Record<
    string,
    { code: string; provider: string; account_name: string | null }
  > = {};
  let districtOptions: string[] = [];
  let providerOptions: string[] = [];

  if (profile.role === "SYSTEM_ADMIN") {
    const [institutionsResponse, momoCodesResponse] = await Promise.all([
      supabase
        .schema("app")
        .from("financial_institutions")
        .select("id, name, kind, district, sacco_id, metadata, created_at, updated_at")
        .order("name", { ascending: true }),
      supabase
        .schema("app")
        .from("momo_codes")
        .select("id, provider, district, code, account_name, description, metadata, created_at, updated_at")
        .order("district", { ascending: true }),
    ]);

    if (institutionsResponse.error && !isMissingRelationError(institutionsResponse.error)) {
      throw institutionsResponse.error;
    }
    if (momoCodesResponse.error && !isMissingRelationError(momoCodesResponse.error)) {
      throw momoCodesResponse.error;
    }

    financialInstitutions = (institutionsResponse.data ?? []) as Database["app"]["Tables"]["financial_institutions"]["Row"][];
    momoCodes = (momoCodesResponse.data ?? []) as Database["app"]["Tables"]["momo_codes"]["Row"][];

    districtMomoMap = momoCodes.reduce<Record<string, { code: string; provider: string; account_name: string | null }>>(
      (acc, code) => {
        const key = (code.district ?? "").toUpperCase();
        if (!key) return acc;
        acc[key] = {
          code: code.code,
          provider: code.provider,
          account_name: code.account_name,
        };
        return acc;
      },
      {},
    );

    const districtSet = new Set<string>();
    saccos.forEach((row) => {
      if (row.district) districtSet.add(row.district.toUpperCase());
    });
    financialInstitutions.forEach((row) => {
      if (row.district) districtSet.add(row.district.toUpperCase());
    });
    momoCodes.forEach((row) => {
      if (row.district) districtSet.add(row.district.toUpperCase());
    });
    districtOptions = Array.from(districtSet).sort((a, b) => a.localeCompare(b));
    providerOptions = Array.from(new Set(momoCodes.map((row) => row.provider ?? ""))).filter(Boolean).sort();
  }

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="admin.saccos.title" fallback="SACCO registry" />}
        subtitle={
          <Trans
            i18nKey="admin.saccos.subtitle"
            fallback="Manage onboarding, contact details, and compliance for each SACCO tenant."
            className="text-xs text-neutral-3"
          />
        }
        badge={<StatusChip tone="info">{scope.includeAll ? saccos.length : 1} tenants</StatusChip>}
      />

      {profile.role === "SYSTEM_ADMIN" ? (
        <>
          <GlassCard
            title={<Trans i18nKey="admin.saccos.registry" fallback="Registry" />}
            subtitle={
              <Trans
                i18nKey="admin.saccos.registrySubtitle"
                fallback="Create, edit, or deactivate SACCO tenants."
                className="text-xs text-neutral-3"
              />
            }
          >
            <SaccoRegistryManager initialSaccos={saccos} districtMomoMap={districtMomoMap} />
          </GlassCard>

          <GlassCard
            title={<Trans i18nKey="admin.financialInstitutions.title" fallback="Financial institutions" />}
            subtitle={
              <Trans
                i18nKey="admin.financialInstitutions.subtitle"
                fallback="Catalogue partner financial institutions and link them to SACCO tenants."
                className="text-xs text-neutral-3"
              />
            }
          >
            <FinancialInstitutionManager
              initialInstitutions={financialInstitutions}
              saccoOptions={saccoOptions}
              districtOptions={districtOptions}
            />
          </GlassCard>

          <GlassCard
            title={<Trans i18nKey="admin.momoCodes.title" fallback="MoMo codes" />}
            subtitle={
              <Trans
                i18nKey="admin.momoCodes.subtitle"
                fallback="Manage mobile money merchant codes by district to automate USSD instructions."
                className="text-xs text-neutral-3"
              />
            }
          >
            <MomoCodeTable
              initialCodes={momoCodes}
              providerOptions={providerOptions}
              districtOptions={districtOptions}
            />
          </GlassCard>
        </>
      ) : (
        <GlassCard
          title={<Trans i18nKey="admin.saccos.readonly" fallback="Tenant details" />}
          subtitle={<Trans i18nKey="admin.saccos.readonlySubtitle" fallback="Read-only metadata for your assigned SACCO." className="text-xs text-neutral-3" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            {saccos.map((sacco) => (
              <div key={sacco.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{sacco.sector_code}</p>
                <p className="mt-2 text-lg font-semibold text-neutral-0">{sacco.name}</p>
                <p className="text-xs text-neutral-3">{sacco.district}, {sacco.province}</p>
                <p className="text-xs text-neutral-2">{sacco.category}</p>
                <StatusChip tone={sacco.status === "ACTIVE" ? "success" : "warning"}>{sacco.status}</StatusChip>
              </div>
            ))}
          </dl>
        </GlassCard>
      )}
    </div>
  );
}
