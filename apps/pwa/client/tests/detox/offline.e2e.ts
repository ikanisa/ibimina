import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("Offline banner appears and gating prevents submission", async () => {
  const scenario = createScenario({
    initial: {
      name: "dashboard",
      accessibilityElements: ["offline-banner", "submit"],
      canProceed: false,
    },
  });

  await scenario.device.launchApp();
  await scenario.device.setOffline(true);
  await scenario.element("offline-banner").expectVisible();
  await assert.rejects(async () => scenario.element("submit").tap());
});
