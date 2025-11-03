import type { Route } from "next";
import type { ProfileRow } from "@/lib/auth";

export type AtlasIconKey =
  | "layout-dashboard"
  | "layers-3"
  | "inbox"
  | "line-chart"
  | "shield-check"
  | "bar-chart-3"
  | "shield"
  | "globe-2"
  | "handshake"
  | "users-round";

export type AtlasNavBadgeRule = "ops-alerts" | "profile-security" | "admin-role";

export interface AtlasNavigationGroup {
  id: string;
  labelKey: string;
  labelFallback: string;
}

export interface AtlasNavigationItemDefinition {
  id: string;
  groupId: AtlasNavigationGroup["id"];
  href: Route;
  pattern: string;
  icon: AtlasIconKey;
  labelKey: string;
  labelFallback: string;
  titleKey?: string;
  titleFallback?: string;
  descriptionKey?: string;
  descriptionFallback?: string;
  permissions?: ProfileRow["role"][];
  badgeRule?: AtlasNavBadgeRule;
}

export interface AtlasBreadcrumbDefinition {
  key: string;
  fallback: string;
  href?: Route;
}

export interface AtlasRouteDefinition {
  id: string;
  pattern: string;
  parentId: AtlasNavigationItemDefinition["id"];
  titleKey?: string;
  titleFallback?: string;
  descriptionKey?: string;
  descriptionFallback?: string;
  breadcrumbs?: AtlasBreadcrumbDefinition[];
  layout?: {
    fullWidth?: boolean;
    hideActionBar?: boolean;
    hideBreadcrumbs?: boolean;
    assistant?: "hidden" | "placeholder";
  };
}

export interface AtlasNavigationConfig {
  groups: AtlasNavigationGroup[];
  items: AtlasNavigationItemDefinition[];
  routes: AtlasRouteDefinition[];
}

export const ATLAS_NAV_GROUPS: AtlasNavigationGroup[] = [
  { id: "overview", labelKey: "nav.group.overview", labelFallback: "Overview" },
  { id: "money", labelKey: "nav.group.money", labelFallback: "Money movement" },
  { id: "intelligence", labelKey: "nav.group.intelligence", labelFallback: "Intelligence" },
  { id: "operations", labelKey: "nav.group.operations", labelFallback: "Operations" },
  { id: "network", labelKey: "nav.group.network", labelFallback: "Network" },
  { id: "workspace", labelKey: "nav.group.workspace", labelFallback: "Workspace" },
  { id: "administration", labelKey: "nav.group.administration", labelFallback: "Administration" },
];

export const ATLAS_NAV_ITEMS: AtlasNavigationItemDefinition[] = [
  {
    id: "dashboard",
    groupId: "overview",
    href: "/dashboard",
    pattern: "/dashboard",
    icon: "layout-dashboard",
    labelKey: "nav.dashboard.label",
    labelFallback: "Command center",
    titleKey: "nav.dashboard.title",
    titleFallback: "Command center",
    descriptionKey: "nav.dashboard.description",
    descriptionFallback: "Monitor institution health and daily performance.",
  },
  {
    id: "ikimina",
    groupId: "money",
    href: "/ikimina",
    pattern: "/ikimina",
    icon: "layers-3",
    labelKey: "nav.ikimina.label",
    labelFallback: "Groups & products",
    titleKey: "nav.ikimina.title",
    titleFallback: "Groups & products",
    descriptionKey: "nav.ikimina.description",
    descriptionFallback: "Manage savings groups, products, and rosters.",
  },
  {
    id: "recon",
    groupId: "money",
    href: "/recon",
    pattern: "/recon",
    icon: "inbox",
    labelKey: "nav.recon.label",
    labelFallback: "Reconciliation desk",
    titleKey: "nav.recon.title",
    titleFallback: "Reconciliation desk",
    descriptionKey: "nav.recon.description",
    descriptionFallback: "Clear unassigned deposits and reconcile statements.",
    badgeRule: "ops-alerts",
  },
  {
    id: "reports",
    groupId: "money",
    href: "/reports",
    pattern: "/reports",
    icon: "bar-chart-3",
    labelKey: "nav.reports.label",
    labelFallback: "Reports & exports",
    titleKey: "nav.reports.title",
    titleFallback: "Reports & exports",
    descriptionKey: "nav.reports.description",
    descriptionFallback: "Generate statements and bulk exports.",
  },
  {
    id: "analytics",
    groupId: "intelligence",
    href: "/analytics",
    pattern: "/analytics",
    icon: "line-chart",
    labelKey: "nav.analytics.label",
    labelFallback: "Analytics",
    titleKey: "nav.analytics.title",
    titleFallback: "Analytics",
    descriptionKey: "nav.analytics.description",
    descriptionFallback: "Track contribution trends and early risk signals.",
  },
  {
    id: "ops",
    groupId: "operations",
    href: "/ops",
    pattern: "/ops",
    icon: "shield-check",
    labelKey: "nav.ops.label",
    labelFallback: "Operations desk",
    titleKey: "nav.ops.title",
    titleFallback: "Operations desk",
    descriptionKey: "nav.ops.description",
    descriptionFallback: "Review incidents, alerts, and MFA health.",
    badgeRule: "ops-alerts",
  },
  {
    id: "countries",
    groupId: "network",
    href: "/countries",
    pattern: "/countries",
    icon: "globe-2",
    labelKey: "nav.countries.label",
    labelFallback: "Countries",
    titleKey: "nav.countries.title",
    titleFallback: "Countries",
    descriptionKey: "nav.countries.description",
    descriptionFallback: "Configure coverage and regulatory metadata.",
    permissions: ["SYSTEM_ADMIN"],
  },
  {
    id: "partners",
    groupId: "network",
    href: "/partners",
    pattern: "/partners",
    icon: "handshake",
    labelKey: "nav.partners.label",
    labelFallback: "Partners",
    titleKey: "nav.partners.title",
    titleFallback: "Partners",
    descriptionKey: "nav.partners.description",
    descriptionFallback: "Manage partner integrations and onboarding.",
    permissions: ["SYSTEM_ADMIN"],
  },
  {
    id: "profile",
    groupId: "workspace",
    href: "/profile",
    pattern: "/profile",
    icon: "shield",
    labelKey: "nav.profile.label",
    labelFallback: "My security",
    titleKey: "nav.profile.title",
    titleFallback: "My security",
    descriptionKey: "nav.profile.description",
    descriptionFallback: "Update MFA, password, and session security.",
    badgeRule: "profile-security",
  },
  {
    id: "admin",
    groupId: "administration",
    href: "/admin/overview",
    pattern: "/admin",
    icon: "users-round",
    labelKey: "nav.admin.label",
    labelFallback: "System admin",
    titleKey: "nav.admin.title",
    titleFallback: "System administration",
    descriptionKey: "nav.admin.description",
    descriptionFallback: "Configure tenants, staff, and compliance controls.",
    permissions: ["SYSTEM_ADMIN"],
    badgeRule: "admin-role",
  },
];

export const ATLAS_ROUTE_DEFINITIONS: AtlasRouteDefinition[] = [
  {
    id: "dashboard",
    pattern: "/dashboard",
    parentId: "dashboard",
  },
  {
    id: "ikimina-root",
    pattern: "/ikimina",
    parentId: "ikimina",
  },
  {
    id: "ikimina-detail",
    pattern: "/ikimina/[id]",
    parentId: "ikimina",
    titleKey: "nav.ikimina.detail",
    titleFallback: "Group detail",
    breadcrumbs: [{ key: "breadcrumbs.ikimina.detail", fallback: "Group detail" }],
  },
  {
    id: "ikimina-members",
    pattern: "/ikimina/[id]/members",
    parentId: "ikimina",
    titleKey: "nav.ikimina.members",
    titleFallback: "Members",
    breadcrumbs: [
      { key: "breadcrumbs.ikimina.detail", fallback: "Group detail", href: "/ikimina" },
      { key: "breadcrumbs.ikimina.members", fallback: "Members" },
    ],
  },
  {
    id: "ikimina-deposits",
    pattern: "/ikimina/[id]/deposits",
    parentId: "ikimina",
    titleKey: "nav.ikimina.deposits",
    titleFallback: "Deposits",
    breadcrumbs: [
      { key: "breadcrumbs.ikimina.detail", fallback: "Group detail", href: "/ikimina" },
      { key: "breadcrumbs.ikimina.deposits", fallback: "Deposits" },
    ],
  },
  {
    id: "ikimina-statements",
    pattern: "/ikimina/[id]/statements",
    parentId: "ikimina",
    titleKey: "nav.ikimina.statements",
    titleFallback: "Statements",
    breadcrumbs: [
      { key: "breadcrumbs.ikimina.detail", fallback: "Group detail", href: "/ikimina" },
      { key: "breadcrumbs.ikimina.statements", fallback: "Statements" },
    ],
  },
  {
    id: "ikimina-settings",
    pattern: "/ikimina/[id]/settings",
    parentId: "ikimina",
    titleKey: "nav.ikimina.settings",
    titleFallback: "Settings",
    breadcrumbs: [
      { key: "breadcrumbs.ikimina.detail", fallback: "Group detail", href: "/ikimina" },
      { key: "breadcrumbs.ikimina.settings", fallback: "Settings" },
    ],
  },
  {
    id: "recon",
    pattern: "/recon",
    parentId: "recon",
  },
  {
    id: "analytics",
    pattern: "/analytics",
    parentId: "analytics",
  },
  {
    id: "ops",
    pattern: "/ops",
    parentId: "ops",
  },
  {
    id: "reports",
    pattern: "/reports",
    parentId: "reports",
  },
  {
    id: "countries",
    pattern: "/countries",
    parentId: "countries",
  },
  {
    id: "countries-new",
    pattern: "/countries/new",
    parentId: "countries",
    titleKey: "nav.countries.new",
    titleFallback: "Add country",
    breadcrumbs: [
      { key: "nav.countries.label", fallback: "Countries", href: "/countries" },
      { key: "breadcrumbs.common.create", fallback: "Create" },
    ],
  },
  {
    id: "countries-detail",
    pattern: "/countries/[id]",
    parentId: "countries",
    titleKey: "nav.countries.detail",
    titleFallback: "Configure country",
    breadcrumbs: [
      { key: "nav.countries.label", fallback: "Countries", href: "/countries" },
      { key: "breadcrumbs.common.detail", fallback: "Detail" },
    ],
  },
  {
    id: "partners",
    pattern: "/partners",
    parentId: "partners",
  },
  {
    id: "partners-detail",
    pattern: "/partners/[id]",
    parentId: "partners",
    titleKey: "nav.partners.detail",
    titleFallback: "Partner detail",
    breadcrumbs: [
      { key: "nav.partners.label", fallback: "Partners", href: "/partners" },
      { key: "breadcrumbs.common.detail", fallback: "Detail" },
    ],
  },
  {
    id: "profile",
    pattern: "/profile",
    parentId: "profile",
  },
  {
    id: "admin",
    pattern: "/admin",
    parentId: "admin",
    layout: {
      fullWidth: true,
      hideActionBar: true,
      assistant: "hidden",
    },
  },
];

export const ATLAS_NAVIGATION: AtlasNavigationConfig = {
  groups: ATLAS_NAV_GROUPS,
  items: ATLAS_NAV_ITEMS,
  routes: ATLAS_ROUTE_DEFINITIONS,
};
