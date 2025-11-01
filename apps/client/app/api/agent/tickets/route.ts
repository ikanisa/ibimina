/**
 * AI Agent API - Tickets Management
 *
 * Create and manage support tickets across multiple channels
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { captureEdgeEvent } from "@ibimina/lib";

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    await captureEdgeEvent(
      "ticket_created",
      {
        orgId: org_id,
        channel,
        priority: priority || "normal",
      },
      user.id
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Error in tickets API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    // Get user's tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error in tickets API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
