"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { VirtualTable } from "@/components/datagrid/virtual-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { Database } from "@/lib/supabase/types";
import { StatusChip } from "@/components/common/status-chip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BilingualText } from "@/components/common/bilingual-text";
import { IkiminaSettingsEditor } from "@/components/ikimina/ikimina-settings-editor";

const MEMBER_TABS = ["Overview", "Members", "Deposits", "Statements", "Settings"] as const;

type TabKey = typeof MEMBER_TABS[number];

type MemberRow = Database["public"]["Tables"]["ikimina_members"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

type StatementSummary = {
  label: string;
  postedTotal: number;
  unallocatedTotal: number;
  transactionCount: number;
};

interface IkiminaDetailTabsProps {
  detail: {
    id: string;
    name: string;
    code: string;
    status: string;
    type: string;
    saccoName?: string | null;
    saccoDistrict?: string | null;
    settings: Record<string, unknown> | null;
    membersCount: number;
    recentTotal: number;
    analytics: {
      monthTotal: number;
      onTimeRate: number;
      unallocatedCount: number;
      lastDepositAt: string | null;
      activeMembers: number;
      totalMembers: number;
    };
    saccoId: string | null;
  };
  members: MemberRow[];
  payments: PaymentRow[];
  statements: StatementSummary[];
  history?: Array<{
    id: string;
    action: string;
    actorLabel: string;
    createdAt: string;
    diff: Record<string, unknown> | null;
  }>;
}

const currencyFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const paymentStatuses = ["ALL", "POSTED", "SETTLED", "UNALLOCATED", "PENDING"] as const;

type PaymentFilter = (typeof paymentStatuses)[number];

const TAB_LABELS: Record<TabKey, { primary: string; secondary: string }> = {
  Overview: { primary: "Overview", secondary: "Inshamake" },
  Members: { primary: "Members", secondary: "Abanyamuryango" },
  Deposits: { primary: "Deposits", secondary: "Imisanzu" },
  Statements: { primary: "Statements", secondary: "Raporo" },
  Settings: { primary: "Settings", secondary: "Amabwiriza" },
};

const PAYMENT_STATUS_LABELS: Record<PaymentFilter, { primary: string; secondary: string }> = {
  ALL: { primary: "All", secondary: "Byose" },
  POSTED: { primary: "Posted", secondary: "Byemejwe" },
  SETTLED: { primary: "Settled", secondary: "Byarangije" },
  UNALLOCATED: { primary: "Unallocated", secondary: "Bitaragabanywa" },
  PENDING: { primary: "Pending", secondary: "Birategereje" },
};

export function IkiminaDetailTabs({ detail, members, payments, statements, history }: IkiminaDetailTabsProps) {
  const [tab, setTab] = useState<TabKey>("Overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [depositFilter, setDepositFilter] = useState<PaymentFilter>("ALL");

  const deferredMemberSearch = useDeferredValue(memberSearch);

  const memberColumns = useMemo<ColumnDef<MemberRow, unknown>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: () => (
          <BilingualText
            primary="Name"
            secondary="Izina"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-0">{row.original.full_name}</p>
            <p className="text-xs text-neutral-2">Code · {row.original.member_code ?? "—"}</p>
          </div>
        ),
        meta: { template: "minmax(220px, 2fr)" },
      },
      {
        accessorKey: "msisdn",
        header: () => (
          <BilingualText
            primary="MSISDN"
            secondary="Numero"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        meta: { template: "minmax(180px, 1fr)" },
      },
      {
        accessorKey: "status",
        header: () => (
          <BilingualText
            primary="Status"
            secondary="Imiterere"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => <StatusChip tone="neutral">{getValue() as string}</StatusChip>,
        meta: { template: "minmax(140px, 0.8fr)" },
      },
      {
        accessorKey: "joined_at",
        header: () => (
          <BilingualText
            primary="Joined"
            secondary="Yinjiye"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return value ? new Date(value).toLocaleDateString() : "—";
        },
        meta: { template: "minmax(140px, 0.9fr)" },
      },
    ],
    [],
  );

  const paymentColumns = useMemo<ColumnDef<PaymentRow, unknown>[]>(
    () => [
      {
        accessorKey: "occurred_at",
        header: () => (
          <BilingualText
            primary="Occurred"
            secondary="Igihe byabereye"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => dateFormatter.format(new Date(getValue() as string)),
        meta: { template: "minmax(180px, 1.2fr)" },
      },
      {
        accessorKey: "amount",
        header: () => (
          <BilingualText
            primary="Amount"
            secondary="Amafaranga"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ row }) => currencyFormatter.format(row.original.amount),
        meta: { align: "right", template: "minmax(150px, 0.8fr)", cellClassName: "font-semibold" },
      },
      {
        accessorKey: "reference",
        header: () => (
          <BilingualText
            primary="Reference"
            secondary="Indango"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => (getValue() as string | null) ?? "—",
        meta: { template: "minmax(180px, 1.2fr)" },
      },
      {
        accessorKey: "status",
        header: () => (
          <BilingualText
            primary="Status"
            secondary="Imiterere"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => <StatusChip tone="neutral">{getValue() as string}</StatusChip>,
        meta: { template: "minmax(140px, 0.8fr)" },
      },
    ],
    [],
  );

  const statementColumns = useMemo<ColumnDef<StatementSummary, unknown>[]>(
    () => [
      {
        accessorKey: "label",
        header: () => (
          <BilingualText
            primary="Month"
            secondary="Ukwezi"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        meta: { template: "minmax(160px, 1fr)" },
      },
      {
        accessorKey: "postedTotal",
        header: () => (
          <BilingualText
            primary="Posted"
            secondary="Byemejwe"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => currencyFormatter.format(Number(getValue() ?? 0)),
        meta: { align: "right", template: "minmax(150px, 0.8fr)", cellClassName: "font-semibold" },
      },
      {
        accessorKey: "unallocatedTotal",
        header: () => (
          <BilingualText
            primary="Unallocated"
            secondary="Bitaragabanywa"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        cell: ({ getValue }) => currencyFormatter.format(Number(getValue() ?? 0)),
        meta: { align: "right", template: "minmax(150px, 0.8fr)" },
      },
      {
        accessorKey: "transactionCount",
        header: () => (
          <BilingualText
            primary="Transactions"
            secondary="Imyitwarire"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        ),
        meta: { align: "right", template: "minmax(130px, 0.7fr)" },
      },
    ],
    [],
  );

  const filteredMembers = useMemo(() => {
    const query = deferredMemberSearch.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => {
      const target = `${member.full_name} ${member.member_code ?? ""} ${member.msisdn ?? ""}`.toLowerCase();
      return target.includes(query);
    });
  }, [members, deferredMemberSearch]);

  const filteredPayments = useMemo(() => {
    if (depositFilter === "ALL") return payments;
    return payments.filter((payment) => payment.status === depositFilter);
  }, [payments, depositFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {MEMBER_TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "interactive-scale rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]",
              tab === item ? "bg-white/15 text-neutral-0" : "bg-white/5 text-neutral-2"
            )}
          >
            <BilingualText
              primary={TAB_LABELS[item].primary}
              secondary={TAB_LABELS[item].secondary}
              layout="inline"
              className="items-center gap-2"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            title="Active members"
            primary={`${detail.analytics.activeMembers}/${detail.analytics.totalMembers}`}
            subtitle="Active / total"
          />
          <OverviewCard
            title="This month"
            primary={currencyFormatter.format(detail.analytics.monthTotal)}
            subtitle="Posted volume"
          />
          <OverviewCard
            title="On-time rate"
            primary={`${detail.analytics.onTimeRate}%`}
            subtitle="Posted vs total"
          />
          <OverviewCard
            title="Last deposit"
            primary={relativeDate(detail.analytics.lastDepositAt)}
            subtitle={detail.analytics.lastDepositAt ? dateFormatter.format(new Date(detail.analytics.lastDepositAt)) : "No deposits recorded"}
          />
        </div>
      )}

      {tab === "Members" && (
        <div className="space-y-4">
          <div className="max-w-sm">
            <Input
              label="Search members / Shakisha abanyamuryango"
              placeholder="Search by name, MSISDN, or code / Shakisha izina, nimero cyangwa kode"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
            />
          </div>
          <VirtualTable
            data={filteredMembers}
            columns={memberColumns}
            emptyState={<EmptyState title="No members" description="Import members to get started." />}
          />
        </div>
      )}

      {tab === "Deposits" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {paymentStatuses.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDepositFilter(option)}
                className={cn(
                  "rounded-full px-4 py-1 text-xs uppercase tracking-[0.25em]",
                  depositFilter === option ? "bg-white/15 text-neutral-0" : "bg-white/5 text-neutral-2"
                )}
              >
                <BilingualText
                  primary={PAYMENT_STATUS_LABELS[option].primary}
                  secondary={PAYMENT_STATUS_LABELS[option].secondary}
                  layout="inline"
                  className="items-center gap-2"
                  secondaryClassName="text-[10px] text-neutral-3"
                />
              </button>
            ))}
          </div>
          <VirtualTable
            data={filteredPayments}
            columns={paymentColumns}
            emptyState={<EmptyState title="No deposits" description="Recent transactions will appear here." />}
          />
        </div>
      )}

      {tab === "Statements" && (
        <VirtualTable
          data={statements}
          columns={statementColumns}
          emptyState={<EmptyState title="No statements" description="Statements will appear as transactions post." />}
        />
      )}

      {tab === "Settings" && (
        <IkiminaSettingsEditor
          ikiminaId={detail.id}
          ikiminaName={detail.name}
          saccoId={detail.saccoId ?? null}
          initialSettings={detail.settings as Record<string, unknown> | null}
          history={history}
        />
      )}
    </div>
  );
}

function OverviewCard({ title, primary, subtitle }: { title: string; primary: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glass">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-0">{primary}</p>
      <p className="text-xs text-neutral-2">{subtitle}</p>
    </div>
  );
}
