import assert from "node:assert/strict";
import test from "node:test";

import { randomUUID } from "node:crypto";

import { bootstrapAgentSession, runAgentTurn } from "../src/index.js";

function createRequest(message: string, sessionId?: string) {
  return { sessionId: sessionId ?? randomUUID(), message };
}

test("creates a session with triage agent by default", () => {
  const session = bootstrapAgentSession();
  assert.equal(session.currentAgent, "triage");
  assert.equal(session.history[0].role, "system");
});

test("routes billing questions to the billing specialist", async () => {
  const response = await runAgentTurn(createRequest("I need help with transaction TX-9081"));
  assert.ok(response.reply.includes("billing"));
  assert.equal(response.toolInvocations?.[0].name, "lookupTransaction");
});

test("uses system health tool for uptime questions", async () => {
  const response = await runAgentTurn(createRequest("Is the platform down?"));
  assert.equal(response.toolInvocations?.[0].name, "systemHealth");
});

test("pulls group documentation when asked about inviting members", async () => {
  const response = await runAgentTurn(createRequest("How do I invite members to my group?"));
  assert.equal(response.toolInvocations?.[0].name, "getPlatformDoc");
});
