#!/usr/bin/env tsx
/*
 * Seeds pilot Nyamagabe SACCO organisations, user accounts, and permissions.
 *
 * The script is idempotent and can be re-run to align environments. It relies
 * on service-role credentials so ensure the following environment variables are
 * exported before execution:
 *
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - (optional) PILOT_SEED_PASSWORD
 */

import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import {
  env,
  featureFlagDefinitions,
  getTenantFeatureFlags,
  PILOT_DISTRICT,
  PILOT_TENANTS,
  type PilotTenant,
} from "@ibimina/config";

const DEFAULT_PASSWORD = process.env.PILOT_SEED_PASSWORD ?? "PilotSacco#2025";

const SACCO_STATUS = "ACTIVE";

type SchemaName = "public" | "app";

type DatabaseClient = SupabaseClient;

type UpsertOptions = {
  readonly schema: SchemaName;
  readonly conflictTarget: string;
};

type UpsertRow = Record<string, unknown>;

interface PilotUserSeed {
  readonly email: string;
  readonly fullName: string;
  readonly role: "DISTRICT_MANAGER" | "SACCO_MANAGER" | "SACCO_STAFF";
  readonly orgId: string;
  readonly saccoId: string | null;
  readonly phone?: string;
}

const pilotTenantBySlug = new Map<string, PilotTenant>(
  PILOT_TENANTS.map((tenant) => [tenant.slug, tenant])
);

const pilotUsers: ReadonlyArray<PilotUserSeed> = [
  {
    email: "district.nyamagabe@pilot.ibimina.rw",
    fullName: "Nyamagabe District Manager",
    role: "DISTRICT_MANAGER",
    orgId: PILOT_DISTRICT.id,
    saccoId: null,
    phone: "+250788000111",
  },
  {
    email: "gasaka.manager@pilot.ibimina.rw",
    fullName: "Gasaka SACCO Manager",
    role: "SACCO_MANAGER",
    orgId: pilotTenantBySlug.get("nyamagabe-gasaka")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-gasaka")?.saccoId ?? null,
    phone: "+250788000211",
  },
  {
    email: "gasaka.staff@pilot.ibimina.rw",
    fullName: "Gasaka SACCO Staff",
    role: "SACCO_STAFF",
    orgId: pilotTenantBySlug.get("nyamagabe-gasaka")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-gasaka")?.saccoId ?? null,
    phone: "+250788000212",
  },
  {
    email: "kaduha.manager@pilot.ibimina.rw",
    fullName: "Kaduha SACCO Manager",
    role: "SACCO_MANAGER",
    orgId: pilotTenantBySlug.get("nyamagabe-kaduha")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-kaduha")?.saccoId ?? null,
    phone: "+250788000311",
  },
  {
    email: "kaduha.staff@pilot.ibimina.rw",
    fullName: "Kaduha SACCO Staff",
    role: "SACCO_STAFF",
    orgId: pilotTenantBySlug.get("nyamagabe-kaduha")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-kaduha")?.saccoId ?? null,
    phone: "+250788000312",
  },
  {
    email: "kamegeri.manager@pilot.ibimina.rw",
    fullName: "Kamegeri SACCO Manager",
    role: "SACCO_MANAGER",
    orgId: pilotTenantBySlug.get("nyamagabe-kamegeri")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-kamegeri")?.saccoId ?? null,
    phone: "+250788000411",
  },
  {
    email: "kamegeri.staff@pilot.ibimina.rw",
    fullName: "Kamegeri SACCO Staff",
    role: "SACCO_STAFF",
    orgId: pilotTenantBySlug.get("nyamagabe-kamegeri")?.id ?? "",
    saccoId: pilotTenantBySlug.get("nyamagabe-kamegeri")?.saccoId ?? null,
    phone: "+250788000412",
  },
].map((seed) => {
  if (!seed.orgId) {
    throw new Error(`Missing organisation mapping for ${seed.email}`);
  }
  if (seed.role !== "DISTRICT_MANAGER" && !seed.saccoId) {
    throw new Error(`Missing SACCO mapping for ${seed.email}`);
  }
  return seed;
});

function createClientOrThrow(): DatabaseClient {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "platform-api:seed-pilot-sacco",
      },
    },
  });
}

function isMissingRelation(error: PostgrestError): boolean {
  return (
    typeof error.message === "string" &&
    error.message.includes("does not exist") &&
    error.message.includes("relation")
  );
}

function createWrappedError(table: string, schema: string, error: PostgrestError): Error {
  const wrapped = new Error(`Failed to upsert into ${schema}.${table}: ${error.message}`);
  (wrapped as { cause?: PostgrestError }).cause = error;
  return wrapped;
}

async function upsertRows(
  client: DatabaseClient,
  table: string,
  rows: ReadonlyArray<UpsertRow>,
  options: UpsertOptions
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const qualified = options.schema === "public" ? table : `${options.schema}.${table}`;
  const { error } = await client
    .from(qualified)
    .upsert(rows, { onConflict: options.conflictTarget });

  if (error) {
    if (isMissingRelation(error)) {
      console.warn(`⚠️  Skipped ${qualified}: table does not exist in this environment.`);
      return;
    }
    throw createWrappedError(table, options.schema, error);
  }

  console.log(`   ↳ upserted ${rows.length} row(s) into ${qualified}`);
}

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = (error as { message?: string }).message ?? "";
  return message.includes(`column \"${column}\"`) && message.includes("does not exist");
}

function buildSaccoRows(includeOrgLink: boolean): UpsertRow[] {
  const districtName = PILOT_DISTRICT.name.replace(/\s*District$/i, "");
  return PILOT_TENANTS.map((tenant) => {
    const metadata = {
      pilot: true,
      slug: tenant.slug,
      merchant_code: tenant.merchantCode,
      feature_flags: getTenantFeatureFlags(tenant.id),
    } as const;

    const baseRow: UpsertRow = {
      id: tenant.saccoId,
      name: tenant.displayName,
      district: districtName,
      province: PILOT_DISTRICT.province,
      sector: tenant.sectorName,
      sector_code: tenant.sectorCode,
      merchant_code: tenant.merchantCode,
      status: SACCO_STATUS,
      email: tenant.contactEmail,
      metadata,
      district_org_id: tenant.districtOrgId,
    };

    if (includeOrgLink) {
      return { ...baseRow, org_id: tenant.id };
    }

    return baseRow;
  });
}

async function seedOrganizations(client: DatabaseClient): Promise<void> {
  console.log("→ Seeding pilot organizations");

  const districtRow: UpsertRow = {
    id: PILOT_DISTRICT.id,
    type: "DISTRICT",
    name: PILOT_DISTRICT.name,
    district_code: PILOT_DISTRICT.districtCode,
    parent_id: null,
  };

  const saccoOrgRows: UpsertRow[] = PILOT_TENANTS.map((tenant) => ({
    id: tenant.id,
    type: "SACCO",
    name: tenant.displayName,
    district_code: PILOT_DISTRICT.districtCode,
    parent_id: PILOT_DISTRICT.id,
  }));

  await upsertRows(client, "organizations", [districtRow, ...saccoOrgRows], {
    schema: "public",
    conflictTarget: "id",
  });

  await upsertRows(client, "organizations", [districtRow, ...saccoOrgRows], {
    schema: "app",
    conflictTarget: "id",
  });
}

async function seedSaccos(client: DatabaseClient): Promise<void> {
  console.log("→ Seeding pilot SACCO records");

  try {
    await upsertRows(client, "saccos", buildSaccoRows(true), {
      schema: "app",
      conflictTarget: "id",
    });
  } catch (error) {
    if (isMissingColumnError(error, "org_id")) {
      console.warn("⚠️  app.saccos.org_id not found; retrying without org linkage");
      await upsertRows(client, "saccos", buildSaccoRows(false), {
        schema: "app",
        conflictTarget: "id",
      });
      return;
    }
    throw error;
  }
}

async function ensurePilotUsers(client: DatabaseClient): Promise<Map<string, string>> {
  console.log("→ Ensuring pilot staff accounts");
  const idByEmail = new Map<string, string>();

  for (const seed of pilotUsers) {
    const { data: existing, error: selectError } = await client
      .from("auth.users")
      .select("id")
      .eq("email", seed.email)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      throw createWrappedError("users", "auth", selectError);
    }

    if (existing?.id) {
      idByEmail.set(seed.email, existing.id);
      await client.auth.admin.updateUserById(existing.id, {
        password: DEFAULT_PASSWORD,
        user_metadata: {
          pilot: true,
          full_name: seed.fullName,
          phone: seed.phone,
          sacco_id: seed.saccoId,
          org_id: seed.orgId,
        },
        email_confirm: true,
      });
      console.log(`   ↳ refreshed existing user ${seed.email}`);
      continue;
    }

    const { data, error } = await client.auth.admin.createUser({
      email: seed.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        pilot: true,
        full_name: seed.fullName,
        phone: seed.phone,
        sacco_id: seed.saccoId,
        org_id: seed.orgId,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error(`Failed to create user for ${seed.email}`);
    }

    idByEmail.set(seed.email, data.user.id);
    console.log(`   ↳ created user ${seed.email}`);
  }

  return idByEmail;
}

async function seedUserProfiles(client: DatabaseClient, ids: Map<string, string>): Promise<void> {
  console.log("→ Upserting user profiles");
  const rows = pilotUsers.map((seed) => ({
    user_id: ids.get(seed.email)!,
    role: seed.role,
    sacco_id: seed.saccoId,
  }));

  await upsertRows(client, "user_profiles", rows, {
    schema: "app",
    conflictTarget: "user_id",
  });
}

async function seedOrgMemberships(client: DatabaseClient, ids: Map<string, string>): Promise<void> {
  console.log("→ Upserting organisation memberships");
  const rows = pilotUsers.map((seed) => ({
    user_id: ids.get(seed.email)!,
    org_id: seed.orgId,
    role: seed.role,
  }));

  await upsertRows(client, "org_memberships", rows, {
    schema: "public",
    conflictTarget: "user_id,org_id",
  });

  await upsertRows(client, "org_memberships", rows, {
    schema: "app",
    conflictTarget: "user_id,org_id",
  });
}

async function seedFeatureFlagMetadata(client: DatabaseClient): Promise<void> {
  console.log("→ Annotating feature flag metadata (for audit dashboards)");

  const featureFlagRows = PILOT_TENANTS.map((tenant) => ({
    org_id: tenant.id,
    flags: featureFlagDefinitions,
  }));

  await upsertRows(client, "feature_flags_metadata", featureFlagRows, {
    schema: "public",
    conflictTarget: "org_id",
  });
}

async function main() {
  console.log("Starting pilot SACCO seed...");
  const client = createClientOrThrow();

  await seedOrganizations(client);
  await seedSaccos(client);
  const ids = await ensurePilotUsers(client);
  await seedUserProfiles(client, ids);
  await seedOrgMemberships(client, ids);
  await seedFeatureFlagMetadata(client);

  console.log("✅ Pilot SACCO seed complete");
}

main().catch((error) => {
  console.error("❌ Pilot SACCO seed failed");
  console.error(error);
  process.exitCode = 1;
});
