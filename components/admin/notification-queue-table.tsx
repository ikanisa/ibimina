"use client";

import { useMemo } from "react";
import { BilingualText } from "@/components/common/bilingual-text";

interface NotificationRow {
  id: string;
  event: string;
  sacco_id: string | null;
  template_id: string | null;
  status: string | null;
  scheduled_for: string | null;
  created_at: string | null;
}

interface NotificationQueueTableProps {
  rows: NotificationRow[];
  saccoLookup: Map<string, string>;
  templateLookup: Map<string, string>;
}

export function NotificationQueueTable({ rows, saccoLookup, templateLookup }: NotificationQueueTableProps) {
  const emptyState = rows.length === 0;
  const formatted = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        saccoLabel: row.sacco_id ? saccoLookup.get(row.sacco_id) ?? row.sacco_id : "All SACCOs",
        templateLabel: row.template_id ? templateLookup.get(row.template_id) ?? row.template_id : "—",
        createdLabel: row.created_at ? new Date(row.created_at).toLocaleString() : "—",
        scheduledLabel: row.scheduled_for ? new Date(row.scheduled_for).toLocaleString() : "—",
      })),
    [rows, saccoLookup, templateLookup]
  );

  if (emptyState) {
    return (
      <p className="text-sm text-neutral-2">
        <BilingualText
          primary="No notifications queued yet."
          secondary="Nta butumwa burategurwa."
          secondaryClassName="text-xs text-neutral-3"
        />
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
          <tr>
            <th className="px-4 py-3">
              <BilingualText primary="Event" secondary="Icyabaye" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
            <th className="px-4 py-3">
              <BilingualText primary="SACCO" secondary="Ikigo" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
            <th className="px-4 py-3">
              <BilingualText primary="Template" secondary="Inyandiko" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
            <th className="px-4 py-3">
              <BilingualText primary="Status" secondary="Imiterere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
            <th className="px-4 py-3">
              <BilingualText primary="Queued" secondary="Byashyizweho" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
            <th className="px-4 py-3">
              <BilingualText primary="Scheduled" secondary="Iteganijwe" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {formatted.map((row) => (
            <tr key={row.id} className="hover:bg-white/5">
              <td className="px-4 py-3 text-neutral-0">{row.event}</td>
              <td className="px-4 py-3 text-neutral-2">{row.saccoLabel}</td>
              <td className="px-4 py-3 text-neutral-2">{row.templateLabel}</td>
              <td className="px-4 py-3 text-neutral-2">{row.status ?? "pending"}</td>
              <td className="px-4 py-3 text-neutral-2">{row.createdLabel}</td>
              <td className="px-4 py-3 text-neutral-2">{row.scheduledLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
