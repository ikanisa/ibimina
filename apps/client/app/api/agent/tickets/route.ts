/**
 * AI Agent API - Tickets Management
 *
 * Create and manage support tickets across multiple channels
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

export function __setAgentTicketsSupabaseFactoryForTests(
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
    const { org_id, channel, subject, priority, meta } = body;

    if (!org_id || !channel || !subject) {
      return NextResponse.json(
        { error: "org_id, channel, and subject are required" },
        { status: 400 }
      );
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        org_id,
        user_id: user.id,
        channel,
        subject,
        priority: priority || "normal",
        meta: meta || {},
        status: "open",
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      if (detectNetworkFailure(ticketError)) {
        return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
      }

      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Error in tickets API:", error);
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

    // Get user's tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      if (detectNetworkFailure(ticketsError)) {
        return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
      }

      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error in tickets API:", error);
    if (detectNetworkFailure(error)) {
      return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
