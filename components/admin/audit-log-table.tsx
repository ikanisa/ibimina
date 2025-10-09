 "use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BilingualText } from "@/components/common/bilingual-text";
import { cn } from "@/lib/utils";

export type AuditLogEntry = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorLabel: string;
  createdAt: string;
  diff: Record<string, unknown> | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
});

function DiffViewer({ diff }: { diff: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!diff || Object.keys(diff).length === 0) {
    return (
      <p className="text-[11px] text-neutral-3">
        <BilingualText
          primary="No diff captured."
          secondary="Nta mpinduka zanditswe."
          secondaryClassName="text-[10px]"
        />
      </p>
    );
  }

  const preview = JSON.stringify(diff, null, expanded ? 2 : 0);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-1 transition hover:border-white/40 hover:text-neutral-0"
      >
        {expanded ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
        <BilingualText
          primary={expanded ? "Hide diff" : "Show diff"}
          secondary={expanded ? "Hisha impinduka" : "Garagaza impinduka"}
          className="leading-none"
          secondaryClassName="text-[10px]"
        />
      </button>
      <pre className="max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] leading-snug text-neutral-0">{preview}</pre>
    </div>
  );
}

interface AuditLogTableProps {
  rows: AuditLogEntry[];
}

export function AuditLogTable({ rows }: AuditLogTableProps) {
  if (!rows.length) {
    return (
      <p className="text-sm text-neutral-2">
        <BilingualText
          primary="No audit records yet."
          secondary="Nta byakozwe byanditswe."
          secondaryClassName="text-xs text-neutral-3"
        />
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article
          key={row.id}
          className={cn(
            "rounded-2xl border border-white/10 bg-white/5 p-4 text-sm shadow-inner backdrop-blur transition hover:border-white/20",
          )}
        >
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <BilingualText
              primary={`${row.action} · ${row.entity}`}
              secondary={`${row.action} · ${row.entity}`}
              className="text-base font-semibold text-neutral-0"
              secondaryClassName="text-[12px] text-neutral-2"
            />
            <span className="text-xs text-neutral-3">{dateFormatter.format(new Date(row.createdAt))}</span>
          </header>
          <p className="mt-2 text-xs text-neutral-2">
            <BilingualText
              primary={`Actor: ${row.actorLabel}`}
              secondary={`Uwabikoze: ${row.actorLabel}`}
              secondaryClassName="text-[11px]"
            />
          </p>
          {row.entityId && (
            <p className="mt-1 text-[11px] text-neutral-3">
              <BilingualText
                primary={`Entity ID: ${row.entityId}`}
                secondary={`Indangamuntu: ${row.entityId}`}
                secondaryClassName="text-[10px]"
              />
            </p>
          )}
          <div className="mt-3">
            <DiffViewer diff={row.diff} />
          </div>
        </article>
      ))}
    </div>
  );
}
