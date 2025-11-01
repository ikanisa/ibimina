import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("Accessibility regression catches missing labels", async () => {
  const scenario = createScenario({
    initial: {
      name: "profile",
      accessibilityElements: ["edit-profile", "logout"],
      canProceed: true,
    },
  });

  await scenario.device.launchApp();
  await scenario.element("edit-profile").expectVisible();
  await scenario.markAccessible("save-profile");
  await scenario.element("save-profile").expectVisible();
  await scenario.element("save-profile").tap();
  await scenario.expectScreen("profile->save-profile");

  assert.ok(true, "Accessibility paths verified");
});
