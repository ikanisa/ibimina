import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("Offline indicator toggles when connectivity changes", async () => {
  const scenario = createScenario({
    initial: {
      name: "dashboard-home",
      accessibilityElements: ["accounts", "transactions", "offline-banner"],
      canProceed: true,
    },
  });

  await scenario.device.launchApp();
  await scenario.expectScreen("dashboard-home");
  assert.equal(scenario.isOffline(), false, "Starts online");

  await scenario.device.setOffline(true);
  assert.equal(scenario.isOffline(), true, "Offline state enabled");

  await scenario.element("offline-banner").expectVisible();
  await scenario.element("accounts").tap();
  await scenario.expectScreen("dashboard-home->accounts");

  await scenario.device.setOffline(false);
  assert.equal(scenario.isOffline(), false, "Connectivity restored");
});
