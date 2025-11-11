"use server";

/**
 * Feature Flag Service
 *
 * Loads feature flags from remote configuration providers (ConfigCat,
 * Flagsmith) or from Supabase configuration when available. Falls back to
 * environment-provided defaults for local development.
 */

import {
  type FeatureFlags,
  mergeFeatureFlagSources,
  normalizeFlagKey,
  parseFeatureFlagsFromEnv,
} from "./utils";
import { requireSupabaseConfig } from "@/lib/supabase/config";

type RemoteFlagRecord = Record<string, unknown>;

/**
 * Load feature flags from the configured providers.
 */
export async function loadFeatureFlags(): Promise<FeatureFlags> {
  const envFlags = parseFeatureFlagsFromEnv();
  let remoteFlags: FeatureFlags | undefined;

  if (process.env.CONFIGCAT_SDK_KEY) {
    remoteFlags = await safeLoad(fetchConfigCatFlags(process.env.CONFIGCAT_SDK_KEY));
  } else if (process.env.FLAGSMITH_ENVIRONMENT_KEY) {
    remoteFlags = await safeLoad(fetchFlagsmithFlags(process.env.FLAGSMITH_ENVIRONMENT_KEY));
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    remoteFlags = await safeLoad(fetchSupabaseFeatureFlags(process.env.SUPABASE_SERVICE_ROLE_KEY));
  }

  return mergeFeatureFlagSources(envFlags, remoteFlags);
}

async function safeLoad(loader: Promise<FeatureFlags>): Promise<FeatureFlags | undefined> {
  try {
    const flags = await loader;
    return Object.keys(flags).length > 0 ? flags : undefined;
  } catch (error) {
    console.error("[feature-flags] Failed to load remote flags", error);
    return undefined;
  }
}

async function fetchConfigCatFlags(sdkKey: string): Promise<FeatureFlags> {
  const response = await fetch(
    `https://cdn.configcat.com/configuration-files/${encodeURIComponent(sdkKey)}/config_v2.json`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`ConfigCat request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { f?: RemoteFlagRecord };
  const rawFlags = payload.f ?? {};
  const flags: FeatureFlags = {};

  Object.entries(rawFlags).forEach(([key, descriptor]) => {
    if (!descriptor || typeof descriptor !== "object") {
      return;
    }

    const normalizedKey = normalizeFlagKey(key);
    const value = extractBoolean((descriptor as { v?: unknown }).v);

    if (typeof value === "boolean") {
      flags[normalizedKey] = value;
    }
  });

  return flags;
}

async function fetchFlagsmithFlags(environmentKey: string): Promise<FeatureFlags> {
  const response = await fetch("https://edge.api.flagsmith.com/api/v1/flags/", {
    headers: {
      Authorization: environmentKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Flagsmith request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    feature: { name: string };
    enabled: boolean;
    value?: unknown;
  }>;

  const flags: FeatureFlags = {};

  payload.forEach((flag) => {
    const normalizedKey = normalizeFlagKey(flag.feature?.name ?? "");
    if (!normalizedKey) {
      return;
    }

    const booleanValue = extractBoolean(flag.value);
    flags[normalizedKey] = typeof booleanValue === "boolean" ? booleanValue : flag.enabled;
  });

  return flags;
}

async function fetchSupabaseFeatureFlags(serviceRoleKey: string): Promise<FeatureFlags> {
  const { url, anonKey } = requireSupabaseConfig("loadFeatureFlags");
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/feature_flags?select=key,is_enabled&country_id=is.null&org_id=is.null`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase feature flag request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ key?: string; is_enabled?: unknown }>;
  const flags: FeatureFlags = {};

  payload.forEach((row) => {
    const normalizedKey = normalizeFlagKey(row.key ?? "");
    if (!normalizedKey) {
      return;
    }
    flags[normalizedKey] = extractBoolean(row.is_enabled) ?? false;
  });

  return flags;
}

function extractBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true" || value === "1") {
      return true;
    }
    if (value === "false" || value === "0") {
      return false;
    }
    return undefined;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return undefined;
}
