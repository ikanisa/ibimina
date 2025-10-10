"use client";

import { useTranslation } from "@/providers/i18n-provider";

interface TransProps {
  i18nKey: string;
  fallback: string;
  className?: string;
  children?: never;
}

export function Trans({ i18nKey, fallback, className }: TransProps) {
  const { t } = useTranslation();
  return <span className={className}>{t(i18nKey, fallback)}</span>;
}

