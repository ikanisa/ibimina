import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { StaffDirectoryTable } from "@/components/admin/staff/staff-directory-table";
import { StaffFilters } from "@/components/admin/staff/staff-filters";
import { AddStaffDrawerTrigger } from "@/components/admin/staff/add-staff-drawer";
import { Trans } from "@/components/common/trans";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { isMissingRelationError } from "@/lib/supabase/errors";
import {
  resolveTenantScope,
  resolveTenantScopeSearchParams,
  type TenantScopeSearchParamsInput,
} from "@/lib/admin/scope";

interface StaffPageProps {
  searchParams?: TenantScopeSearchParamsInput & {
    org_type?: string;
    role?: string;
    status?: string;
  };
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { profile } = await requireUserAndProfile();
  
  // Only system admins can access staff directory
  if (profile.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized: Only system administrators can access staff directory");
  }

  const resolvedSearchParams = await resolveTenantScopeSearchParams(searchParams);
  const scope = resolveTenantScope(profile, resolvedSearchParams);
  const supabase = createSupabaseServiceRoleClient("admin/panel/staff");

  // Get filters
  const orgTypeFilter = getParam(searchParams?.org_type);
  const roleFilter = getParam(searchParams?.role);
  const statusFilter = getParam(searchParams?.status);

  // Build staff query with joins to get org info
  let staffQuery = supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      phone,
      role,
      sacco_id,
      account_status,
      pw_reset_required,
      last_login_at,
      created_at,
      updated_at,
      sacco:saccos(id, name, district, status)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (roleFilter) {
    staffQuery = staffQuery.eq("role", roleFilter);
  }
  if (statusFilter) {
    staffQuery = staffQuery.eq("account_status", statusFilter);
  }
  if (!scope.includeAll && scope.saccoId) {
    staffQuery = staffQuery.eq("sacco_id", scope.saccoId);
  }

  const { data: staffRows, error: staffError } = await staffQuery;

  if (staffError && !isMissingRelationError(staffError)) {
    throw staffError;
  }

  // Get organization memberships for multi-tenant staff
  const { data: orgMemberships, error: orgError } = await supabase
    .from("org_memberships")
    .select(`
      user_id,
      org_id,
      role,
      organization:organizations(id, name, type, parent_id)
    `);

  if (orgError && !isMissingRelationError(orgError)) {
    throw orgError;
  }

  // Build staff list with org memberships
  const staffList = (staffRows ?? []).map((staff) => {
    const memberships = (orgMemberships ?? [])
      .filter((m) => m.user_id === staff.id)
      .map((m) => ({
        org_id: m.org_id,
        role: m.role,
        org_name: m.organization?.name ?? "Unknown",
        org_type: m.organization?.type ?? "SACCO",
      }));

    return {
      ...staff,
      org_memberships: memberships,
    };
  });

  // Apply org type filter if specified
  let filteredStaff = staffList;
  if (orgTypeFilter) {
    filteredStaff = staffList.filter((staff) =>
      staff.org_memberships.some((m) => m.org_type === orgTypeFilter)
    );
  }

  // Get organizations for filters
  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, type")
    .order("name", { ascending: true });

  if (orgsError && !isMissingRelationError(orgsError)) {
    throw orgsError;
  }

  const organizations = orgs ?? [];

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="admin.staff.title" fallback="Staff directory" />}
        subtitle={
          <Trans
            i18nKey="admin.staff.subtitle"
            fallback="Manage staff accounts, roles, and access across all organizations."
            className="text-xs text-neutral-3"
          />
        }
        badge={<StatusChip tone="info">{filteredStaff.length} staff</StatusChip>}
      />

      <GlassCard
        title={<Trans i18nKey="admin.staff.filters" fallback="Filters" />}
        subtitle={
          <Trans
            i18nKey="admin.staff.filtersSubtitle"
            fallback="Filter staff by organization type, role, and account status."
            className="text-xs text-neutral-3"
          />
        }
      >
        <StaffFilters
          organizations={organizations}
          currentOrgType={orgTypeFilter}
          currentRole={roleFilter}
          currentStatus={statusFilter}
        />
      </GlassCard>

      <GlassCard
        title={<Trans i18nKey="admin.staff.directory" fallback="Directory" />}
        subtitle={
          <Trans
            i18nKey="admin.staff.directorySubtitle"
            fallback="View and manage staff accounts, invite new users, and control access."
            className="text-xs text-neutral-3"
          />
        }
        actions={<AddStaffDrawerTrigger organizations={organizations} />}
      >
        <StaffDirectoryTable staff={filteredStaff} />
      </GlassCard>
    </div>
  );
}

function getParam(input: string | string[] | undefined): string {
  if (!input) return "";
  return Array.isArray(input) ? input[0] ?? "" : input;
}
