"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/common/status-chip";
import { MemberImportWizard } from "@/components/ikimina/member-import-wizard";
import { MemberPdfImportDialog } from "@/components/ikimina/member-pdf-import-dialog";
import type { Database } from "@/lib/supabase/types";
import { useTranslation } from "@/providers/i18n-provider";

const STATUS_FILTERS = ["all", "active", "inactive"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type MemberRow = Database["public"]["Views"]["ikimina_members_public"]["Row"];

interface MemberDirectoryCardProps {
  groupName: string;
  members: MemberRow[];
  allowImports: boolean;
  ikiminaId: string;
  saccoId: string | null;
}

export function MemberDirectoryCard({
  groupName,
  members,
  allowImports,
  ikiminaId,
  saccoId,
}: MemberDirectoryCardProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const deferredQuery = useDeferredValue(query);
  const quickActionsLabel = t("ikimina.members.quickActions", "Member actions");

  const columns = useMemo<ColumnDef<MemberRow>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.name", "Name")}
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-neutral-0">{row.original.full_name}</span>
        ),
        meta: { template: "minmax(160px, 1.4fr)" },
      },
      {
        accessorKey: "member_code",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.memberCode", "Member code")}
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-neutral-2">
            {row.original.member_code ?? "—"}
          </span>
        ),
        meta: { template: "minmax(120px, 0.8fr)" },
      },
      {
        accessorKey: "msisdn",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.msisdn", "MSISDN")}
          </span>
        ),
        cell: ({ row }) => <span className="text-neutral-2">{row.original.msisdn ?? "—"}</span>,
        meta: { template: "minmax(140px, 1fr)" },
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.status", "Status")}
          </span>
        ),
        cell: ({ row }) => (
          <StatusChip tone={row.original.status === "ACTIVE" ? "success" : "warning"}>
            {row.original.status}
          </StatusChip>
        ),
        meta: { template: "minmax(110px, 0.6fr)" },
      },
      {
        accessorKey: "joined_at",
        header: () => (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("table.joined", "Joined")}
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-neutral-2">
            {row.original.joined_at ? new Date(row.original.joined_at).toLocaleDateString() : "—"}
          </span>
        ),
        meta: { template: "minmax(140px, 0.8fr)" },
      },
    ],
    [t],
  );

  const filteredMembers = useMemo(() => {
    const lowerQuery = deferredQuery.trim().toLowerCase();
    return members.filter((member) => {
      const statusMatch =
        status === "all" ||
        (status === "active" && member.status === "ACTIVE") ||
        (status === "inactive" && member.status !== "ACTIVE");
      if (!statusMatch) return false;
      if (lowerQuery.length === 0) return true;
      const haystack = `${member.full_name} ${member.member_code ?? ""} ${member.msisdn ?? ""}`.toLowerCase();
      return haystack.includes(lowerQuery);
    });
  }, [members, deferredQuery, status]);

  const desktopActions = allowImports ? (
    <div className="hidden items-center gap-2 md:flex">
      <MemberImportWizard ikiminaId={ikiminaId} saccoId={saccoId} />
      <MemberPdfImportDialog ikiminaId={ikiminaId} saccoId={saccoId} />
    </div>
  ) : (
    <span className="text-xs uppercase tracking-[0.3em] text-neutral-3">
      {t("ikimina.members.readOnly", "Read only")}
    </span>
  );

  return (
    <>
      <GlassCard
        title={`${t("ikimina.members.title", "Members")} · ${groupName}`}
        subtitle={`${members.length} ${t("ikimina.members.count", "members")}`}
        actions={desktopActions}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="sm:max-w-xs">
              <Input
                label={t("ikimina.members.searchLabel", "Search members")}
                placeholder={t("ikimina.members.searchPlaceholder", "Search by name, MSISDN, or code")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <SegmentedControl
              value={status}
              onValueChange={(next) => {
                if (typeof next !== "string") return;
                setStatus(next as StatusFilter);
              }}
              options={STATUS_FILTERS.map((value) => ({
                value,
                label: t(`ikimina.members.filter.${value}`, value === "all" ? "All" : value === "active" ? "Active" : "Inactive"),
              }))}
              aria-label={t("ikimina.members.filter.label", "Filter members")}
              className="sm:max-w-sm"
              columns={3}
            />
          </div>

          <VirtualTable
            data={filteredMembers}
            columns={columns}
            emptyState={
              <EmptyState
                title={t("ikimina.members.emptyTitle", "No members")}
                description={t("ikimina.members.emptyDescription", "Import members to get started.")}
              />
            }
          />
        </div>
      </GlassCard>

      {allowImports && (
        <StickyActionBar label={quickActionsLabel}>
          <div className="flex w-full items-center justify-between gap-3">
            <MemberImportWizard ikiminaId={ikiminaId} saccoId={saccoId} />
            <MemberPdfImportDialog ikiminaId={ikiminaId} saccoId={saccoId} />
          </div>
        </StickyActionBar>
      )}
    </>
  );
}
