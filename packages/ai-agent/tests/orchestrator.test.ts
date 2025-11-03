import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { bootstrapAgentSession, runAgentTurn } from "../src/index.js";

function createRequest(message: string, sessionId?: string) {
  return { sessionId: sessionId ?? randomUUID(), message };
}

describe("agent orchestrator", () => {
  it("creates a session with triage agent by default", () => {
    const session = bootstrapAgentSession();

    expect(session.currentAgent).toBe("triage");
    expect(session.history[0]?.role).toBe("system");
  });

  it("routes billing questions to the billing specialist", async () => {
    const response = await runAgentTurn(createRequest("I need help with transaction TX-9081"));

    expect(response.reply).toContain("billing");
    expect(response.toolInvocations?.[0]?.name).toBe("lookupTransaction");
  });

  it("uses system health tool for uptime questions", async () => {
    const response = await runAgentTurn(createRequest("Is the platform down?"));

    expect(response.toolInvocations?.[0]?.name).toBe("systemHealth");
  });

  it("pulls group documentation when asked about inviting members", async () => {
    const response = await runAgentTurn(createRequest("How do I invite members to my group?"));

    expect(response.toolInvocations?.[0]?.name).toBe("getPlatformDoc");
  });
});
