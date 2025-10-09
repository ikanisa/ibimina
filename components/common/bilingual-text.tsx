"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

interface BilingualTextProps {
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  className?: string;
  secondaryClassName?: string;
  layout?: "stack" | "inline";
}

export function BilingualText({
  primary,
  secondary,
  tertiary,
  className,
  secondaryClassName,
  layout = "stack",
}: BilingualTextProps) {
  const { locale } = useTranslation();

  let content: ReactNode = primary;
  if (locale === "rw" && secondary) {
    content = secondary;
  } else if (locale === "fr") {
    content = tertiary ?? primary;
  }

  const baseClass = layout === "inline" ? "inline-flex items-center gap-2" : "inline-flex flex-col gap-1";
  const combinedClassName = cn(baseClass, className, secondaryClassName);

  return <span className={combinedClassName}>{content}</span>;
}
