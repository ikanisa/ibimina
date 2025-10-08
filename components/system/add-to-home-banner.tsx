"use client";

import { cn } from "@/lib/utils";

interface AddToHomeBannerProps {
  open: boolean;
  title: string;
  description: string;
  installLabel: string;
  dismissLabel: string;
  onInstall: () => void;
  onDismiss: () => void;
}

export function AddToHomeBanner({
  open,
  title,
  description,
  installLabel,
  dismissLabel,
  onInstall,
  onDismiss,
}: AddToHomeBannerProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        "fixed bottom-24 left-1/2 z-50 w-[min(420px,92%)] -translate-x-1/2",
        "rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-neutral-0 shadow-glass backdrop-blur"
      )}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-0">{title}</h2>
          <p className="mt-1 text-xs text-neutral-2">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onInstall}
            className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass"
          >
            {installLabel}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
