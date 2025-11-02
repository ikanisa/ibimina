/**
 * USSD Pay Sheet API utilities
 * Provides functions for fetching USSD payment parameters and pay sheet data
 *
 * USSD codes are used for mobile money payments in Rwanda via MTN MoMo
 * Format: *182*merchant_code*reference*amount#
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildUssdPayload, type BuildUssdPayloadInput, type UssdPayload } from "@ibimina/lib";

/**
 * USSD Pay Sheet Entry interface
 * Represents a single payment instruction with USSD details
 */
export interface UssdPaySheetEntry {
  id: string;
  member_name: string;
  ussd_code: string;
  payment_amount: number;
  payment_status: "PENDING" | "COMPLETED" | "FAILED";
  ikimina_name: string;
  sacco_name: string;
  merchant_code: string | null;
  reference_code: string;
  due_date: string | null;
  created_at: string;
}

/**
 * USSD Pay Sheet parameters
 * Optional filters for fetching pay sheet entries
 */
export interface UssdPaySheetParams {
  status?: "PENDING" | "COMPLETED" | "FAILED" | null | undefined;
  ikimina_id?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}

/**
 * Fetch USSD pay sheet entries (Server-side)
 * Retrieves payment instructions with USSD codes for the authenticated user
 *
 * @param params - Optional filters for pay sheet entries
 * @returns Array of USSD pay sheet entries
 *
 * @example
 * ```ts
 * const paySheet = await getUssdPaySheet({
 *   status: 'PENDING',
 *   limit: 20
 * });
 * ```
 *
 * @remarks
 * This function uses server-side Supabase client and should be called
 * from Server Components or API routes only
 *
 * @accessibility
 * Returns structured data that can be presented in accessible formats
 * with proper ARIA labels and semantic HTML
 */
export async function getUssdPaySheet(
  params: UssdPaySheetParams = {}
): Promise<UssdPaySheetEntry[]> {
  const { status, limit = 50, offset = 0 } = params;

  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error in getUssdPaySheet:", authError);
    throw new Error("Authentication required to fetch pay sheet");
  }

  // Get user's profile to access member information
  const { data: profile, error: profileError } = await supabase
    .from("members_app_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    // Return empty array if user hasn't completed onboarding
    return [];
  }

  // For demo purposes, we'll create mock data based on user's groups
  // In a real implementation, this would query a payments/contributions table
  // that tracks member dues, contribution schedules, and payment statuses

  // This is a placeholder implementation that demonstrates the data structure
  // TODO: Replace with actual database query when payments schema is implemented
  const mockPaySheetEntries: UssdPaySheetEntry[] = [
    {
      id: "1",
      member_name: "Demo Member",
      ussd_code: "*182*7*REF001*5000#",
      payment_amount: 5000,
      payment_status: "PENDING",
      ikimina_name: "Sample Ikimina",
      sacco_name: "Sample SACCO",
      merchant_code: "7",
      reference_code: "REF001",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  // Filter by status if provided and not null
  let filteredEntries = mockPaySheetEntries;
  if (status != null) {
    filteredEntries = filteredEntries.filter((entry) => entry.payment_status === status);
  }

  // Apply pagination with proper null handling
  const effectiveLimit = limit ?? 50;
  const effectiveOffset = offset ?? 0;
  return filteredEntries.slice(effectiveOffset, effectiveOffset + effectiveLimit);
}

/**
 * Fetch USSD pay sheet entries (Client-side)
 * Retrieves payment instructions with USSD codes for the authenticated user
 *
 * @param params - Optional filters for pay sheet entries
 * @returns Array of USSD pay sheet entries
 *
 * @example
 * ```ts
 * const paySheet = await getUssdPaySheetClient({
 *   status: 'PENDING'
 * });
 * ```
 *
 * @remarks
 * This function uses browser-side Supabase client and should be called
 * from Client Components only
 */
export async function getUssdPaySheetClient(
  params: UssdPaySheetParams = {}
): Promise<UssdPaySheetEntry[]> {
  const { status, limit = 50, offset = 0 } = params;

  const supabase = createSupabaseBrowserClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error in getUssdPaySheetClient:", authError);
    throw new Error("Authentication required to fetch pay sheet");
  }

  // Get user's profile to access member information
  const { data: profile, error: profileError } = await supabase
    .from("members_app_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    // Return empty array if user hasn't completed onboarding
    return [];
  }

  // Mock data for client-side (same as server-side for consistency)
  const mockPaySheetEntries: UssdPaySheetEntry[] = [
    {
      id: "1",
      member_name: "Demo Member",
      ussd_code: "*182*7*REF001*5000#",
      payment_amount: 5000,
      payment_status: "PENDING",
      ikimina_name: "Sample Ikimina",
      sacco_name: "Sample SACCO",
      merchant_code: "7",
      reference_code: "REF001",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  // Filter by status if provided and not null
  let filteredEntries = mockPaySheetEntries;
  if (status != null) {
    filteredEntries = filteredEntries.filter((entry) => entry.payment_status === status);
  }

  // Apply pagination with proper null handling
  const effectiveLimit = limit ?? 50;
  const effectiveOffset = offset ?? 0;
  return filteredEntries.slice(effectiveOffset, effectiveOffset + effectiveLimit);
}

/**
 * Generate USSD code for payment
 * Creates a properly formatted MTN MoMo USSD code
 *
 * @param merchantCode - SACCO merchant code
 * @param referenceCode - Payment reference code
 * @param amount - Payment amount in RWF
 * @returns Formatted USSD code string
 *
 * @example
 * ```ts
 * const code = generateUssdCode("7", "REF001", 5000);
 * // Returns: "*182*7*REF001*5000#"
 * ```
 */
export interface GenerateUssdCodeOptions {
  operatorId?: string;
  locale?: string;
  versionOverride?: string;
  ttlSecondsOverride?: number;
}

export function generateUssdCode(
  merchantCode: string,
  referenceCode: string,
  amount: number,
  options: GenerateUssdCodeOptions = {}
): string {
  const payload = buildUssdPayload({
    merchantCode,
    amount,
    reference: referenceCode,
    operatorId: options.operatorId,
    locale: options.locale,
    versionOverride: options.versionOverride,
    ttlSecondsOverride: options.ttlSecondsOverride,
  });

  return payload.code;
}

export type BuildPlatformPayloadOptions = Omit<BuildUssdPayloadInput, "platform">;

export function buildPlatformPayloads(options: BuildPlatformPayloadOptions): {
  android: UssdPayload;
  ios: UssdPayload;
} {
  const android = buildUssdPayload({
    ...options,
    platform: "android",
  });

  const ios = buildUssdPayload({
    ...options,
    platform: "ios",
  });

  return { android, ios };
}
