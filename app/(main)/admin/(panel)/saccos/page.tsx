import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { SaccoRegistryManager } from "@/components/admin/sacco-registry-manager";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveTenantScope } from "@/lib/admin/scope";
import { Trans } from "@/components/common/trans";

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

  const saccos = saccoRows ?? [];

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
        <GlassCard
          title={<Trans i18nKey="admin.saccos.registry" fallback="Registry" />}
          subtitle={<Trans i18nKey="admin.saccos.registrySubtitle" fallback="Create, edit, or deactivate SACCO tenants." className="text-xs text-neutral-3" />}
        >
          <SaccoRegistryManager initialSaccos={saccos} />
        </GlassCard>
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
