import {
  getTenantFeatureFlags,
  isPilotTenant,
  normalizeTenantId,
  PILOT_TENANTS,
  type PilotTenant,
} from "@ibimina/config";

const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com").replace(
  /\/$/,
  ""
);
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

const tenantById = new Map<string, PilotTenant>(
  PILOT_TENANTS.map((tenant: PilotTenant) => [tenant.id.toLowerCase(), tenant])
);

const tenantBySlug = new Map<string, PilotTenant>(
  PILOT_TENANTS.map((tenant: PilotTenant) => [tenant.slug.toLowerCase(), tenant])
);

type DirectorySurface =
  | "staff-directory"
  | "support-widget"
  | "home-hero"
  | "knowledge-base"
  | "other";
type DirectoryEntryPoint = "nav" | "hero" | "support" | "footer" | "deep-link" | "unknown";

type SupportChannel = "phone" | "email" | "whatsapp" | "ticket" | "sms" | "pwa" | "unknown";
type SupportDeflectionOutcome = "self_service" | "handoff" | "callback";

interface BaseSupportEventOptions {
  readonly tenantId?: string | null;
  readonly surface?: DirectorySurface;
  readonly entryPoint?: DirectoryEntryPoint;
}

export interface DirectoryViewEvent extends BaseSupportEventOptions {
  readonly languages?: ReadonlyArray<string>;
}

export interface DirectorySearchEvent extends BaseSupportEventOptions {
  readonly query: string;
  readonly resultCount: number;
  readonly filters?: Record<string, string | number | boolean | null>;
}

export interface DirectoryContactEvent extends BaseSupportEventOptions {
  readonly channel: SupportChannel;
  readonly contactId?: string;
  readonly contactLabel?: string;
  readonly medium?: "web" | "whatsapp" | "email" | "phone" | "print";
}

export interface SupportDeflectionEvent extends BaseSupportEventOptions {
  readonly resolved: boolean;
  readonly outcome: SupportDeflectionOutcome;
  readonly handoffChannel?: SupportChannel;
  readonly reason?: string;
  readonly followUpInHours?: number;
}

interface TenantContextResult {
  readonly context: Record<string, unknown>;
  readonly distinctId: string;
}

function buildTenantContext(tenantId: string | null | undefined): TenantContextResult {
  const normalized = normalizeTenantId(tenantId);
  const tenant = normalized
    ? (tenantById.get(normalized) ?? tenantBySlug.get(normalized))
    : undefined;
  const canonicalTenantId = tenant?.id ?? normalized ?? null;
  const flags = { ...getTenantFeatureFlags(canonicalTenantId) };

  const context = {
    tenant_id: canonicalTenantId,
    tenant_slug: tenant?.slug ?? null,
    tenant_name: tenant?.displayName ?? null,
    pilot_tenant: isPilotTenant(canonicalTenantId),
    feature_flags: flags,
  } satisfies Record<string, unknown>;

  const distinctId = tenant?.id ?? canonicalTenantId ?? tenant?.slug ?? "anonymous-web";

  return { context, distinctId };
}

function captureSupportEvent(event: string, properties: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  if (!POSTHOG_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[analytics] Skipped ${event} because NEXT_PUBLIC_POSTHOG_KEY is not configured.`
      );
    }
    return;
  }

  const body = JSON.stringify({
    api_key: POSTHOG_API_KEY,
    event,
    properties: {
      ...properties,
      $lib: "ibimina-website",
      $current_url: window.location.href,
    },
    distinct_id: properties.distinct_id ?? properties.tenant_id ?? "anonymous-web",
    timestamp: new Date().toISOString(),
  });

  const endpoint = `${POSTHOG_HOST}/capture/`;

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function trackDirectoryViewed(options: DirectoryViewEvent = {}): void {
  const { context, distinctId } = buildTenantContext(options.tenantId ?? null);

  captureSupportEvent("support_directory_viewed", {
    ...context,
    distinct_id: distinctId,
    surface: options.surface ?? "staff-directory",
    entry_point: options.entryPoint ?? "unknown",
    languages: options.languages ?? null,
  });
}

export function trackDirectorySearch(options: DirectorySearchEvent): void {
  const { context, distinctId } = buildTenantContext(options.tenantId ?? null);

  captureSupportEvent("support_directory_search", {
    ...context,
    distinct_id: distinctId,
    surface: options.surface ?? "staff-directory",
    entry_point: options.entryPoint ?? "unknown",
    query: options.query,
    result_count: options.resultCount,
    filters: options.filters ?? null,
  });
}

export function trackDirectoryContact(options: DirectoryContactEvent): void {
  const { context, distinctId } = buildTenantContext(options.tenantId ?? null);

  captureSupportEvent("support_directory_contact", {
    ...context,
    distinct_id: distinctId,
    surface: options.surface ?? "staff-directory",
    entry_point: options.entryPoint ?? "unknown",
    channel: options.channel,
    contact_id: options.contactId ?? null,
    contact_label: options.contactLabel ?? null,
    medium: options.medium ?? null,
  });
}

export function trackSupportDeflection(options: SupportDeflectionEvent): void {
  const { context, distinctId } = buildTenantContext(options.tenantId ?? null);

  captureSupportEvent("support_deflection_outcome", {
    ...context,
    distinct_id: distinctId,
    surface: options.surface ?? "support-widget",
    entry_point: options.entryPoint ?? "unknown",
    resolved: options.resolved,
    outcome: options.outcome,
    handoff_channel: options.handoffChannel ?? null,
    reason: options.reason ?? null,
    follow_up_hours: options.followUpInHours ?? null,
  });
}

export interface LookerTileSpec {
  readonly title: string;
  readonly description: string;
  readonly explore: string;
  readonly fields: ReadonlyArray<string>;
  readonly filters?: Record<string, string>;
  readonly visualization: "line" | "bar" | "area" | "single_value";
}

export interface PosthogInsightSpec {
  readonly name: string;
  readonly event: string;
  readonly description: string;
  readonly breakdown?: string;
  readonly display?: "ActionsLineGraph" | "ActionsTable" | "ActionsBar";
  readonly filters?: Record<string, unknown>;
}

export interface SupportAnalyticsDashboard {
  readonly title: string;
  readonly cadence: "weekly";
  readonly description: string;
  readonly looker: {
    readonly dashboardSlug: string;
    readonly tiles: ReadonlyArray<LookerTileSpec>;
  };
  readonly posthog: {
    readonly dashboardName: string;
    readonly insights: ReadonlyArray<PosthogInsightSpec>;
  };
}

const pilotTenantLabels = PILOT_TENANTS.map((tenant: PilotTenant) => tenant.displayName).join(", ");

export const supportAnalyticsDashboard: SupportAnalyticsDashboard = Object.freeze({
  title: "Pilot Support & Directory Review",
  cadence: "weekly",
  description:
    "Tracks how Nyamagabe pilot SACCOs use the staff directory and whether support inquiries are deflected to self-service.",
  looker: {
    dashboardSlug: "pilot-support-directory",
    tiles: [
      {
        title: "Directory Views by Tenant",
        description: `Weekly views for pilot tenants (${pilotTenantLabels}).`,
        explore: "support_events",
        fields: ["support_events.week", "support_events.tenant_name", "support_events.views"],
        filters: { event: "support_directory_viewed", pilot: "true" } as Record<string, string>,
        visualization: "line" as const,
      },
      {
        title: "Search to Contact Conversion",
        description: "How many searches lead to a contact hand-off by tenant each week.",
        explore: "support_events",
        fields: ["support_events.week", "support_events.tenant_name", "support_events.conversions"],
        filters: { event: "support_directory_contact", entry_point: "search" } as Record<
          string,
          string
        >,
        visualization: "area" as const,
      },
      {
        title: "Deflection Outcomes",
        description: "Self-service vs. handoff rate for pilot SACCOs.",
        explore: "support_events",
        fields: ["support_events.week", "support_events.outcome", "support_events.events"],
        filters: { event: "support_deflection_outcome" } as Record<string, string>,
        visualization: "bar" as const,
      },
      {
        title: "Most Requested Channels",
        description: "Breakdown of contact channels across the pilot directory.",
        explore: "support_events",
        fields: ["support_events.channel", "support_events.events"],
        filters: { event: "support_directory_contact", period: "last_28_days" } as Record<
          string,
          string
        >,
        visualization: "single_value" as const,
      },
    ],
  },
  posthog: {
    dashboardName: "Pilot Support Funnel",
    insights: [
      {
        name: "Directory Views by Tenant",
        description: "Daily directory views segmented by pilot tenant.",
        event: "support_directory_viewed",
        breakdown: "tenant_slug",
        display: "ActionsLineGraph" as const,
        filters: { pilot_tenant: true },
      },
      {
        name: "Search Conversion Rate",
        description: "Ratio of searches to contact clicks across the pilot directory.",
        event: "support_directory_search",
        breakdown: "tenant_slug",
        display: "ActionsTable" as const,
        filters: { correlated_event: "support_directory_contact" },
      },
      {
        name: "Deflection Outcomes",
        description: "Self-service vs handoff outcomes for weekly support sessions.",
        event: "support_deflection_outcome",
        breakdown: "outcome",
        display: "ActionsBar" as const,
      },
      {
        name: "Top Contact Channels",
        description: "Preferred support channels for pilot SACCO staff.",
        event: "support_directory_contact",
        breakdown: "channel",
        display: "ActionsBar" as const,
        filters: { period: "last_30_days" },
      },
    ],
  },
});
