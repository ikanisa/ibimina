import posthog from "posthog-js";

/**
 * Analytics events for tracking user behavior
 */
export const AnalyticsEvents = {
  // Payment flow
  USSD_SHEET_OPENED: "ussd_sheet_opened",
  REFERENCE_COPIED: "reference_copied",
  USSD_DIALED: "ussd_dialed",
  PAYMENT_MARKED_PAID: "payment_marked_paid",
  PAYMENT_CONFIRMED: "payment_confirmed",

  // Statements
  STATEMENT_VIEWED: "statement_viewed",
  STATEMENT_FILTERED: "statement_filtered",
  PDF_EXPORTED: "pdf_exported",
  CSV_EXPORTED: "csv_exported",

  // Groups
  GROUP_VIEWED: "group_viewed",
  JOIN_REQUEST_SENT: "join_request_sent",
  JOIN_REQUEST_APPROVED: "join_request_approved",

  // Profile
  LANGUAGE_CHANGED: "language_changed",
  PROFILE_UPDATED: "profile_updated",

  // General
  PAGE_VIEW: "$pageview",
  ERROR_OCCURRED: "error_occurred",
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

/**
 * Identify a user
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.identify(userId, traits);
  }
}

/**
 * Reset user identification (logout)
 */
export function resetUser() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.reset();
  }
}

/**
 * Track payment flow funnel
 */
export function trackPaymentFunnel(step: string, properties?: Record<string, unknown>) {
  trackEvent(step as AnalyticsEvent, {
    funnel: "payment",
    funnel_step: step,
    ...properties,
  });
}

/**
 * Track join flow funnel
 */
export function trackJoinFunnel(step: string, properties?: Record<string, unknown>) {
  trackEvent(step as AnalyticsEvent, {
    funnel: "join",
    funnel_step: step,
    ...properties,
  });
}

/**
 * Track statement flow funnel
 */
export function trackStatementFunnel(step: string, properties?: Record<string, unknown>) {
  trackEvent(step as AnalyticsEvent, {
    funnel: "statement",
    funnel_step: step,
    ...properties,
  });
}
