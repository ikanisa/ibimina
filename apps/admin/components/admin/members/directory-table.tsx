"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/common/status-chip";

export type MemberDirectoryRow = Pick<
  Database["public"]["Views"]["ikimina_members_public"]["Row"],
  "id" | "full_name" | "member_code" | "msisdn" | "status" | "joined_at" | "ikimina_id" | "ikimina_name"
>;

interface AdminMembersDirectoryProps {
  rows: MemberDirectoryRow[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function AdminMembersDirectory({ rows }: AdminMembersDirectoryProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const deferredSearch = useDeferredValue(search);

  const groupOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.ikimina_name).filter(Boolean))) as string[];
  }, [rows]);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (group && row.ikimina_name !== group) return false;
      if (!normalizedQuery) return true;
      const haystack = `${row.full_name ?? ""} ${row.member_code ?? ""} ${row.msisdn ?? ""} ${row.ikimina_name ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, deferredSearch, status, group]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input label="Search" placeholder="Search name, code, or MSISDN" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          label="Group"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          options={["", ...groupOptions]}
          emptyLabel="All"
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={STATUS_OPTIONS.map((option) => option.value)}
          emptyLabel="All"
        />
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-3">Total</p>
          <p className="text-2xl font-semibold text-neutral-0">{filtered.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-neutral-1">
          <thead>
            <tr className="text-xs uppercase tracking-[0.25em] text-neutral-3">
              <th scope="col" className="px-3 py-2 text-left">Name</th>
              <th scope="col" className="px-3 py-2 text-left">Group</th>
              <th scope="col" className="px-3 py-2 text-left">Member code</th>
              <th scope="col" className="px-3 py-2 text-left">MSISDN</th>
              <th scope="col" className="px-3 py-2 text-left">Joined</th>
              <th scope="col" className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((member) => (
              <tr key={member.id ?? `${member.ikimina_id}-${member.member_code}`}
                className="transition hover:bg-white/5">
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-0">{member.full_name ?? "—"}</span>
                    <span className="text-xs text-neutral-3">{member.id}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="text-neutral-1">{member.ikimina_name ?? "—"}</span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-2">{member.member_code ?? "—"}</td>
                <td className="px-3 py-2 text-neutral-1">{member.msisdn ?? "—"}</td>
                <td className="px-3 py-2 text-neutral-1">
                  {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2">
                  <StatusChip tone={member.status === "ACTIVE" ? "success" : "warning"}>{member.status ?? "UNKNOWN"}</StatusChip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
