"use client";

import type { ReactNode } from "react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface StickyActionBarProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export function StickyActionBar({ children, label, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center md:hidden",
        className
      )}
    >
      <div
        style={{
          padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
          gap: designTokens.spacing[3],
          borderRadius: designTokens.borderRadius["3xl"],
          borderWidth: designTokens.borderWidth.default,
          backgroundColor: "white",
          boxShadow: designTokens.shadow.lg,
          minHeight: designTokens.size.touchTarget.comfortable,
        }}
        className="pointer-events-auto flex w-[min(440px,92%)] items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-lg"
        role="region"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
