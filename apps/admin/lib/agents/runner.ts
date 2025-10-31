/**
 * Agent Runner - Handles execution and interaction with OpenAI agents
 *
 * Provides utilities for running agents, managing sessions, and streaming responses
 */

import { Agent, run, RunResult } from "@openai/agents";
import { createTriageAgent } from "./config";

/**
 * Message in the conversation
 */
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentName?: string;
}

/**
 * Session state for agent conversations
 */
export interface AgentSession {
  id: string;
  messages: Message[];
  currentAgent: Agent;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * In-memory session storage (replace with Redis or database for production)
 */
const sessions = new Map<string, AgentSession>();

/**
 * Create a new agent session
 */
export function createSession(): AgentSession {
  const sessionId = generateSessionId();
  const session: AgentSession = {
    id: sessionId,
    messages: [],
    currentAgent: createTriageAgent(),
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Get an existing session
 */
export function getSession(sessionId: string): AgentSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Update session last activity
 */
export function touchSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

/**
 * Add a message to the session
 */
export function addMessage(sessionId: string, message: Omit<Message, "id" | "timestamp">): Message {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const fullMessage: Message = {
    ...message,
    id: generateMessageId(),
    timestamp: new Date(),
  };

  session.messages.push(fullMessage);
  session.lastActivity = new Date();

  return fullMessage;
}

/**
 * Run the agent with user input
 */
export async function runAgent(
  sessionId: string,
  userInput: string
): Promise<{ result: RunResult<unknown, Agent>; message: Message }> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Add user message
  const userMessage = addMessage(sessionId, {
    role: "user",
    content: userInput,
  });

  try {
    // Run the agent
    const result = await run(session.currentAgent, userInput);

    // Add assistant response
    const assistantMessage = addMessage(sessionId, {
      role: "assistant",
      content:
        result.finalOutput || "I apologize, but I couldn't generate a response. Please try again.",
      agentName: session.currentAgent.name,
    });

    return { result, message: assistantMessage };
  } catch (error) {
    console.error("Error running agent:", error);

    // Add error message
    const errorMessage = addMessage(sessionId, {
      role: "assistant",
      content:
        "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.",
    });

    throw error;
  }
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupSessions(maxAgeMs: number = 30 * 60 * 1000): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity.getTime() > maxAgeMs) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Stream agent responses (for real-time updates)
 * Note: This is a placeholder for streaming implementation
 */
export async function* streamAgentResponse(
  sessionId: string,
  userInput: string
): AsyncGenerator<string, void, unknown> {
  // For now, we'll yield the complete response
  // In production, integrate with OpenAI streaming API
  const { message } = await runAgent(sessionId, userInput);

  // Simulate streaming by yielding chunks
  const words = message.content.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay for effect
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  totalSessions: number;
  activeSessions: number;
  oldestSession: Date | null;
} {
  const now = Date.now();
  const activeThreshold = 5 * 60 * 1000; // 5 minutes

  let oldestDate: Date | null = null;
  let activeCount = 0;

  for (const session of sessions.values()) {
    if (now - session.lastActivity.getTime() < activeThreshold) {
      activeCount++;
    }
    if (!oldestDate || session.createdAt < oldestDate) {
      oldestDate = session.createdAt;
    }
  }

  return {
    totalSessions: sessions.size,
    activeSessions: activeCount,
    oldestSession: oldestDate,
  };
}
