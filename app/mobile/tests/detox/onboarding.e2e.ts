import { describe, expect, test } from "@jest/globals";
import { createScenario } from "./utils/mockDetox";

const scenario = createScenario({
  initial: {
    name: "onboarding/welcome",
    accessibilityElements: ["welcome-title", "continue-button", "skip-link"],
    canProceed: true,
  },
});

describe("onboarding flow", () => {
  test("walks through welcome and permission screens", async () => {
    await scenario.device.launchApp();
    await scenario.element("welcome-title").expectVisible();
    await scenario.element("continue-button").tap();
    await scenario.markAccessible("permissions-toggle");
    await scenario.element("permissions-toggle").expectVisible();
    await scenario.element("permissions-toggle").tap();
    await scenario.element("continue-button").tap();
    await scenario.expectScreen(
      "onboarding/welcome->continue-button->permissions-toggle->continue-button"
    );
  });
});
