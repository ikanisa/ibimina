import type { ReactNode } from "react";
import { MetricCard, type MetricCardProps } from "@ibimina/ui";

interface KPIStatProps {
  label: ReactNode;
  value: string;
  trend?: ReactNode;
  accent?: MetricCardProps["accent"];
}

export function KPIStat({ label, value, trend, accent = "neutral" }: KPIStatProps) {
  return <MetricCard label={label} value={value} trend={trend} accent={accent} />;
}
