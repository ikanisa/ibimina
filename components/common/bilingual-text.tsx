"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BilingualTextProps {
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
  secondaryClassName?: string;
  layout?: "stack" | "inline";
}

export function BilingualText({
  primary,
  secondary,
  className,
  secondaryClassName,
  layout = "stack",
}: BilingualTextProps) {
  if (layout === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span>{primary}</span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.3em] text-neutral-2",
            secondaryClassName
          )}
        >
          {secondary}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("flex flex-col leading-tight", className)}>
      <span>{primary}</span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.3em] text-neutral-2",
          secondaryClassName
        )}
      >
        {secondary}
      </span>
    </span>
  );
}
