"use client";

import { useState } from "react";
import { Loader2, RefreshCcw, Wifi, WifiOff, X } from "lucide-react";
import { useOfflineQueue } from "@/providers/offline-queue-provider";
import { BilingualText } from "@/components/common/bilingual-text";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<
  import("@/lib/offline/queue").OfflineActionStatus,
  { primary: string; secondary: string; tone: "neutral" | "warning" }
> = {
  pending: {
    primary: "Queued",
    secondary: "Birategereje",
    tone: "neutral",
  },
  syncing: {
    primary: "Syncing",
    secondary: "Birimo bihuzwa",
    tone: "neutral",
  },
  failed: {
    primary: "Retry",
    secondary: "Ongera ugerageze",
    tone: "warning",
  },
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function OfflineQueueIndicator() {
  const { isOnline, actions, pendingCount, retryFailed, clearAction, processing } = useOfflineQueue();
  const [open, setOpen] = useState(false);

  if (isOnline && actions.length === 0) {
    return null;
  }

  const failed = actions.filter((action) => action.status === "failed").length;
  const indicatorTone = !isOnline ? "bg-red-500/80" : failed > 0 ? "bg-amber-400/80" : "bg-emerald-400/80";
  const helperText = !isOnline
    ? "Offline · Ohoraho"
    : failed > 0
      ? "Needs retry · Ongera ugerageze"
      : "Queued · Birategereje";

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] text-neutral-0 shadow-lg backdrop-blur transition hover:bg-white/20",
          !isOnline && "border-red-400/90 text-red-100",
          failed > 0 && isOnline && "border-amber-400/90 text-amber-100",
        )}
        aria-expanded={open}
        aria-controls="offline-queue-panel"
      >
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-ink", indicatorTone)}>
          {pendingCount}
        </span>
        <span>{helperText}</span>
      </button>

      {open && (
        <div
          id="offline-queue-panel"
          className="w-80 rounded-3xl border border-white/10 bg-ink/80 p-4 text-neutral-0 shadow-2xl backdrop-blur-xl"
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <BilingualText
                primary="Offline queue"
                secondary="Urutonde rwo gufata"
                secondaryClassName="text-[11px] text-neutral-2"
              />
              <p className="text-xs text-neutral-2">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1">
                    <Wifi className="h-3 w-3" aria-hidden />
                    <span>Online · Ku murongo</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-300">
                    <WifiOff className="h-3 w-3" aria-hidden />
                    <span>Offline · Ntibiri ku murongo</span>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-1 transition hover:border-white/40 hover:text-neutral-0"
                onClick={() => void retryFailed()}
                aria-label="Retry queued actions"
                disabled={processing || actions.length === 0}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="h-4 w-4" aria-hidden />}
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-1 transition hover:border-white/40 hover:text-neutral-0"
                onClick={() => setOpen(false)}
                aria-label="Close offline queue"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </header>

          <div className="space-y-3">
            {actions.length === 0 ? (
              <p className="text-xs text-neutral-2">
                <BilingualText
                  primary="No queued actions."
                  secondary="Nta bikorwa biri mu rutonde."
                  secondaryClassName="text-[11px] text-neutral-3"
                />
              </p>
            ) : (
              actions.map((action) => {
                const status = STATUS_LABEL[action.status];
                return (
                  <article
                    key={action.id}
                    className={cn(
                      "rounded-2xl border border-white/10 bg-white/5 p-3 text-xs shadow-inner backdrop-blur",
                      action.status === "failed" && "border-amber-400/40 bg-amber-400/10 text-amber-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-neutral-0">{action.summary.primary}</p>
                        <p className="text-[11px] text-neutral-2">{action.summary.secondary}</p>
                      </div>
                      <button
                        type="button"
                        className="text-neutral-3 transition hover:text-neutral-0"
                        onClick={() => void clearAction(action.id)}
                        aria-label="Remove action"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium uppercase tracking-[0.2em]",
                          status.tone === "warning" ? "bg-amber-400/10 text-amber-200" : "bg-white/10 text-neutral-1",
                        )}
                      >
                        {status.primary} · {status.secondary}
                      </span>
                      <span>{formatTimestamp(action.createdAt)}</span>
                    </div>
                    {action.lastError && action.status === "failed" && (
                      <p className="mt-2 rounded-lg bg-black/30 p-2 text-[11px] text-amber-100">{action.lastError}</p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
