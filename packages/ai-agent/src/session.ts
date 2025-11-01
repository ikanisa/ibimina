import { randomUUID } from "node:crypto";

import type { AgentName, Message, SessionState } from "./types.js";

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

const sessions = new Map<string, SessionState>();

function createInitialHistory(): Message[] {
  return [
    {
      role: "system",
      content:
        "You are Ibimina's autonomous customer support agent. Provide concise, actionable answers and use internal tools when needed.",
      timestamp: Date.now(),
    },
  ];
}

export function getOrCreateSession(id?: string): SessionState {
  const sessionId = id ?? randomUUID();
  const existing = sessions.get(sessionId);

  if (existing && Date.now() - existing.updatedAt < SESSION_TTL) {
    return existing;
  }

  const session: SessionState = {
    id: sessionId,
    currentAgent: "triage",
    history: createInitialHistory(),
    updatedAt: Date.now(),
  };

  sessions.set(sessionId, session);
  return session;
}

export function updateSession(session: SessionState): void {
  session.updatedAt = Date.now();
  sessions.set(session.id, session);
}

export function appendMessage(session: SessionState, message: Message): void {
  session.history.push({ ...message, timestamp: Date.now() });
  updateSession(session);
}

export function rotateAgent(session: SessionState, agent: AgentName): void {
  session.currentAgent = agent;
  updateSession(session);
}

export function purgeExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.updatedAt >= SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

export function getActiveSessionCount(): number {
  purgeExpiredSessions();
  return sessions.size;
}
