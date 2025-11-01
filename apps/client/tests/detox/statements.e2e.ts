import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("Statement filters respond to range and product toggles", async () => {
  const scenario = createScenario({
    initial: {
      name: "statements",
      accessibilityElements: ["filter-range", "filter-product", "apply"],
      canProceed: true,
    },
  });

  await scenario.device.launchApp();
  await scenario.element("filter-range").expectVisible();
  await scenario.element("filter-product").expectVisible();
  await scenario.element("filter-range").tap();
  await scenario.element("filter-product").tap();
  await scenario.markAccessible("apply");
  await scenario.element("apply").tap();
  await scenario.expectScreen("statements->filter-range->filter-product->apply");

  assert.ok(true, "Statement filters executed");
});
