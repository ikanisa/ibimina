import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOOL_SCHEMAS, buildAssistantPayload, buildInstructions } from "../setupAgent.ts";

describe("setupAgent configuration", () => {
  it("builds deterministic instructions", () => {
    const first = buildInstructions();
    const second = buildInstructions();

    assert.ok(
      first.includes("Language Policy"),
      "instructions should include language policy heading"
    );
    assert.strictEqual(first, second, "instructions should be deterministic");
  });

  it("produces a stable assistant payload", () => {
    const payload = buildAssistantPayload();
    const again = buildAssistantPayload();

    assert.deepStrictEqual(payload, again, "payload generation should be idempotent");
    assert.ok(payload.instructions.includes("Ibimina SACCO+ autonomous support agent"));
    assert.ok(Array.isArray(payload.tools));
  });

  it("defines valid tool schemas", () => {
    const names = new Set<string>();

    for (const tool of TOOL_SCHEMAS) {
      assert.strictEqual(tool.type, "function");
      assert.ok(tool.function, "function tool metadata should be present");
      assert.ok(tool.function.name.length > 0, "tool name should not be empty");
      assert.ok(
        !names.has(tool.function.name),
        `duplicate tool name detected: ${tool.function.name}`
      );
      names.add(tool.function.name);

      const parameters = tool.function.parameters as Record<string, any> | undefined;
      assert.ok(
        parameters && parameters.type === "object",
        "tool parameters must be an object schema"
      );
      assert.strictEqual(
        parameters.additionalProperties,
        false,
        "tool schema must forbid additional properties"
      );
      assert.ok(Array.isArray(parameters.required), "tool schema must declare required fields");
    }

    assert.ok(names.has("kb.search"), "kb.search tool should exist");
    assert.ok(names.has("web.search"), "web.search tool should exist");
  });
});
