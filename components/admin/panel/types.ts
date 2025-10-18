import type { LucideIcon } from "lucide-react";

export interface TenantOption {
  id: string;
  name: string;
  badge?: string | null;
}

export type PanelBadgeTone = "critical" | "warning" | "info" | "success";

export interface PanelNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: { label: string; tone: PanelBadgeTone } | null;
}
