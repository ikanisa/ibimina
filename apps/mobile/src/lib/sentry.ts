/**
 * Sentry error tracking and performance monitoring
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn;

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("[Sentry] No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture custom error
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: context,
  });
}

/**
 * Capture custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

export { Sentry };
