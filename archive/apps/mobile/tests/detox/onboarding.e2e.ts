import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("Onboarding flow guides users through locale and auth setup", async () => {
  const scenario = createScenario({
    initial: {
      name: "onboarding-welcome",
      accessibilityElements: ["language-picker", "get-started"],
      canProceed: true,
    },
  });

  await scenario.device.launchApp();
  await scenario.expectScreen("onboarding-welcome");

  await scenario.element("language-picker").expectVisible();
  await scenario.element("get-started").tap();
  await scenario.expectScreen("onboarding-welcome->get-started");

  await scenario.markAccessible("phone-input");
  await scenario.element("phone-input").expectVisible();
  await scenario.element("phone-input").tap();
  await scenario.expectScreen("onboarding-welcome->get-started->phone-input");

  assert.ok(
    scenario.getHistory().some((screen) => screen.name.includes("phone-input")),
    "Onboarding advanced to phone capture"
  );
});
