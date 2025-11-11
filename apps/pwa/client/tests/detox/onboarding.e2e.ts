import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("onboarding flow completes funnel", async () => {
  const scenario = createScenario({
    initial: { name: "welcome", accessibilityElements: ["start-button"], canProceed: true },
  });

  await scenario.device.launchApp();
  await scenario.element("start-button").expectVisible();
  await scenario.element("start-button").tap();
  await scenario.markAccessible("accept-terms");
  await scenario.element("accept-terms").expectVisible();
  await scenario.element("accept-terms").tap();
  await scenario.expectScreen("welcome->start-button->accept-terms");

  assert.ok(true, "Onboarding funnel executed");
});
