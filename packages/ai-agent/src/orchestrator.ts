import { appendMessage, getOrCreateSession, rotateAgent } from "./session.js";
import { resolveAgent } from "./agents.js";
import { createDefaultTools } from "./tools.js";
import type { AgentContext, ChatRequest, ChatResponse, SessionState } from "./types.js";

const tools = createDefaultTools();

function buildAgentContext(session: SessionState): AgentContext {
  return {
    sessionId: session.id,
    history: session.history,
    tools,
  };
}

async function executeTurn(session: SessionState, userMessage: string) {
  const context = buildAgentContext(session);
  const handler = resolveAgent(session.currentAgent);
  const result = await handler(userMessage, context);

  if (result.handoff) {
    rotateAgent(session, result.handoff);
    const specialisedHandler = resolveAgent(result.handoff);
    const specialisedResult = await specialisedHandler(userMessage, buildAgentContext(session));
    return specialisedResult;
  }

  return result;
}

export async function runAgentTurn(request: ChatRequest): Promise<ChatResponse> {
  const session = getOrCreateSession(request.sessionId);

  appendMessage(session, { role: "user", content: request.message, timestamp: Date.now() });

  const result = await executeTurn(session, request.message);

  appendMessage(session, { role: "assistant", content: result.reply, timestamp: Date.now() });

  const response: ChatResponse = {
    session,
    reply: result.reply,
  };

  if (result.toolInvocations?.length) {
    response.toolInvocations = result.toolInvocations;
  }

  return response;
}

export function bootstrapAgentSession(sessionId?: string): SessionState {
  return getOrCreateSession(sessionId);
}
