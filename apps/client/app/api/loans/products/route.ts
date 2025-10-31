/**
 * Loans API - Get Available Loan Products
 *
 * Fetch enabled loan products from SACCO/MFI partners
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const org_id = searchParams.get("org_id");

    // Build query
    let query = supabase
      .from("loan_products")
      .select("*")
      .eq("enabled", true)
      .order("display_order", { ascending: true });

    if (org_id) {
      query = query.eq("org_id", org_id);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error("Error fetching loan products:", productsError);
      return NextResponse.json({ error: "Failed to fetch loan products" }, { status: 500 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error in loan products API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
