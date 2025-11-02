/**
 * Loans API - Loan Applications
 *
 * Create and manage loan applications (intermediation only)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

let resolveSupabaseForTests: (() => Promise<SupabaseClient>) | null = null;

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "";
}

function extractErrorCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return undefined;
}

function detectNetworkFailure(error: unknown) {
  const message = extractErrorMessage(error).toLowerCase();
  const code = extractErrorCode(error)?.toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    (code !== undefined && ["econnrefused", "enotfound", "etimedout"].includes(code))
  );
}

async function getSupabaseClient() {
  if (resolveSupabaseForTests) {
    return resolveSupabaseForTests();
  }

  return createSupabaseServerClient();
}

export function __setLoanApplicationsSupabaseFactoryForTests(
  factory: (() => Promise<SupabaseClient>) | null
) {
  resolveSupabaseForTests = factory;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      org_id,
      product_id,
      requested_amount,
      tenor_months,
      purpose,
      applicant_name,
      applicant_phone,
      applicant_email,
      applicant_nid,
    } = body;

    // Validate required fields
    if (
      !org_id ||
      !product_id ||
      !requested_amount ||
      !tenor_months ||
      !applicant_name ||
      !applicant_phone
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create loan application
    const { data: application, error: applicationError } = await supabase
      .from("loan_applications")
      .insert({
        org_id,
        user_id: user.id,
        product_id,
        requested_amount,
        tenor_months,
        purpose,
        applicant_name,
        applicant_phone,
        applicant_email,
        applicant_nid,
        status: "DRAFT",
        documents: [],
      })
      .select()
      .single();

    if (applicationError) {
      console.error("Error creating loan application:", applicationError);
      if (detectNetworkFailure(applicationError)) {
        return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
      }

      return NextResponse.json({ error: "Failed to create loan application" }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error in loan applications API:", error);
    if (detectNetworkFailure(error)) {
      return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's loan applications
    const { data: applications, error: applicationsError } = await supabase
      .from("loan_applications")
      .select(
        `
        *,
        loan_products (
          name,
          partner_name,
          partner_logo_url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error("Error fetching loan applications:", applicationsError);
      if (detectNetworkFailure(applicationsError)) {
        return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
      }

      return NextResponse.json({ error: "Failed to fetch loan applications" }, { status: 500 });
    }

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error in loan applications API:", error);
    if (detectNetworkFailure(error)) {
      return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
