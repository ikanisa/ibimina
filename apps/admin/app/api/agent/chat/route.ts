/**
 * API Route: /api/agent/chat
 *
 * Handles chat interactions with the autonomous AI agent
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getSession,
  runAgent,
  addMessage,
  getSessionStats,
} from "@/lib/agents/runner";
import { z } from "zod";

/**
 * Request schema for chat endpoint
 */
const ChatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(5000),
  action: z.enum(["chat", "new-session", "stats"]).optional().default("chat"),
});

/**
 * POST /api/agent/chat
 *
 * Send a message to the agent and get a response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, message, action } = validation.data;

    // Handle different actions
    switch (action) {
      case "new-session": {
        const newSession = createSession();
        return NextResponse.json({
          sessionId: newSession.id,
          createdAt: newSession.createdAt,
        });
      }

      case "stats": {
        const stats = getSessionStats();
        return NextResponse.json(stats);
      }

      case "chat":
      default: {
        // Validate session ID
        if (!sessionId) {
          return NextResponse.json(
            { error: "Session ID is required for chat action" },
            { status: 400 }
          );
        }

        // Get or validate session
        let session = getSession(sessionId);
        if (!session) {
          // Auto-create session if it doesn't exist
          session = createSession();
          // Update the session ID to match the requested one
          session.id = sessionId;
        }

        // Run the agent with the user's message
        try {
          const { result, message: assistantMessage } = await runAgent(sessionId, message);

          return NextResponse.json({
            sessionId: session.id,
            message: assistantMessage,
            agentName: result.agent?.name || "Support Agent",
            timestamp: assistantMessage.timestamp,
          });
        } catch (error) {
          console.error("Error running agent:", error);
          return NextResponse.json(
            {
              error: "Failed to process message",
              message: "I apologize, but I encountered an error. Please try again.",
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/chat?sessionId=xxx
 *
 * Get chat history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      messages: session.messages,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
