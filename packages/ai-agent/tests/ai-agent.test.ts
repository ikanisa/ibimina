/**
 * Basic test for the AIAgent class
 * Run with: tsx --test tests/ai-agent.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { AIAgent } from "../src/index.js";

describe("AIAgent", () => {
  it("should create an instance with API key", () => {
    const agent = new AIAgent("test-api-key");
    assert.ok(agent, "Agent should be created");
  });

  it("should return a placeholder response for chat requests", async () => {
    const agent = new AIAgent("test-api-key");
    const response = await agent.chat({
      messages: [{ role: "user", content: "Hello" }],
    });

    assert.ok(response, "Response should exist");
    assert.ok(response.message, "Response should have a message");
    assert.strictEqual(typeof response.message, "string", "Message should be a string");
  });

  it("should handle empty messages array", async () => {
    const agent = new AIAgent("test-api-key");
    const response = await agent.chat({
      messages: [],
    });

    assert.ok(response, "Response should exist");
    assert.ok(response.message, "Response should have a message");
  });

  it("should handle multiple messages", async () => {
    const agent = new AIAgent("test-api-key");
    const response = await agent.chat({
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "How are you?" },
      ],
    });

    assert.ok(response, "Response should exist");
    assert.ok(response.message, "Response should have a message");
  });
});
