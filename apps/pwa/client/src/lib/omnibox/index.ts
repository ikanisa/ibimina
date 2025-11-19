import type { IconType } from "react-icons";
import {
  IoCardOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoSparklesOutline,
  IoStatsChartOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";

export type OmniboxSuggestion = {
  id: string;
  label: string;
  icon: IconType;
  type: "navigation" | "account" | "group" | "member" | "action";
  href: string;
  keywords?: string[];
};

const STATIC_SUGGESTIONS: OmniboxSuggestion[] = [
  {
    id: "nav-home",
    label: "Home dashboard",
    icon: IoHomeOutline,
    type: "navigation",
    href: "/home",
    keywords: ["dashboard", "overview", "ahabanza"],
  },
  {
    id: "nav-groups",
    label: "Savings groups",
    icon: IoPeopleOutline,
    type: "navigation",
    href: "/groups",
    keywords: ["amatsinda", "groups", "ikimina"],
  },
  {
    id: "nav-pay",
    label: "Pay contributions",
    icon: IoCardOutline,
    type: "action",
    href: "/pay",
    keywords: ["kwishyura", "payment", "dues"],
  },
  {
    id: "nav-statements",
    label: "Statements",
    icon: IoDocumentTextOutline,
    type: "navigation",
    href: "/statements",
    keywords: ["records", "history", "statement"],
  },
  {
    id: "nav-profile",
    label: "Profile & settings",
    icon: IoPersonOutline,
    type: "navigation",
    href: "/profile",
    keywords: ["settings", "account", "user"],
  },
  {
    id: "nav-offers",
    label: "Offers",
    icon: IoSparklesOutline,
    type: "navigation",
    href: "/offers",
    keywords: ["promotions", "deal"],
  },
  {
    id: "action-apply-loan",
    label: "Apply for a loan",
    icon: IoStatsChartOutline,
    type: "action",
    href: "/loans",
    keywords: ["loan", "credit", "inguzanyo"],
  },
  {
    id: "action-send-money",
    label: "Send money",
    icon: IoSwapHorizontalOutline,
    type: "action",
    href: "/pay",
    keywords: ["transfer", "money", "ohereza"],
  },
];

export async function fetchOmniboxIndex(): Promise<OmniboxSuggestion[]> {
  return STATIC_SUGGESTIONS;
}
