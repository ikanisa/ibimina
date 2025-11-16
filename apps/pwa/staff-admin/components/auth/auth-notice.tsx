"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthNoticeTone = "info" | "success" | "error" | "warning" | "loading" | "muted";

const toneStyles: Record<AuthNoticeTone, string> = {
  info: "bg-atlas-blue/10 text-atlas-blue border-atlas-blue/30",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  loading: "bg-neutral-100 text-neutral-700 border-neutral-200",
  muted: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const toneIcons: Record<AuthNoticeTone, JSX.Element | null> = {
  info: <Info className="h-4 w-4" aria-hidden />,
  success: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  error: <AlertTriangle className="h-4 w-4" aria-hidden />,
  warning: <AlertTriangle className="h-4 w-4" aria-hidden />,
  loading: <Info className="h-4 w-4 animate-pulse" aria-hidden />,
  muted: null,
};

interface AuthNoticeProps {
  tone?: AuthNoticeTone;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AuthNotice({ tone = "info", title, description, action }: AuthNoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border px-3 py-2 text-sm",
        "items-start",
        toneStyles[tone]
      )}
    >
      {toneIcons[tone] ? <span className="mt-0.5">{toneIcons[tone]}</span> : null}
      <div className="space-y-1">
        <p className="font-medium leading-tight">{title}</p>
        {description ? <p className="text-xs leading-snug text-current/90">{description}</p> : null}
        {action ? <div className="pt-1 text-xs">{action}</div> : null}
      </div>
    </div>
  );
}
