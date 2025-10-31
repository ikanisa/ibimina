/**
 * Wallet API - Get User's Tokens
 *
 * Fetch user's wallet tokens (vouchers, loyalty points, etc.)
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
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("wallet_tokens")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error("Error fetching wallet tokens:", tokensError);
      return NextResponse.json({ error: "Failed to fetch wallet tokens" }, { status: 500 });
    }

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Error in wallet tokens API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
