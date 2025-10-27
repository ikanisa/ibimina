import { MetricCard, type MetricCardProps } from "@ibimina/ui";

interface KPIStatProps {
  label: string;
  value: string;
  trend?: string;
  accent?: MetricCardProps["accent"];
}

export function KPIStat({ label, value, trend, accent = "neutral" }: KPIStatProps) {
  return <MetricCard label={label} value={value} trend={trend} accent={accent} />;
}
