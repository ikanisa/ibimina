/**
 * Sentry error tracking and performance monitoring
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { createSentryOptions, scrubPII } from "@ibimina/lib";

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn;
const APP_ENV =
  (Constants.expoConfig?.extra?.appEnv as string | undefined) ??
  (__DEV__ ? "development" : "production");

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("[Sentry] No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    ...createSentryOptions({
      dsn: SENTRY_DSN,
      environment: APP_ENV,
      release: Constants.expoConfig?.extra?.sentryRelease,
      tracesSampleRate: Constants.expoConfig?.extra?.sentryTracesSampleRate,
      profilesSampleRate: Constants.expoConfig?.extra?.sentryProfilesSampleRate,
      defaultTracesSampleRate: __DEV__ ? 1 : 0.2,
      defaultProfilesSampleRate: __DEV__ ? 1 : 0.1,
      extraOptions: {
        debug: __DEV__,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
      },
    }),
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
  Sentry.setUser(scrubPII({ id: userId, email }));
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
    contexts: context ? scrubPII(context) : undefined,
  });
}

/**
 * Capture custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(scrubPII(message), level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: scrubPII(message),
    category,
    data: data ? scrubPII(data) : undefined,
    level: "info",
  });
}

export { Sentry };
