import { describe, expect, test } from "@jest/globals";
import { createScenario } from "./utils/mockDetox";

const scenario = createScenario({
  initial: {
    name: "tabs/statements",
    accessibilityElements: [
      "Statements tab",
      "Download January 2025 statement",
      "Download December 2024 statement",
    ],
    canProceed: true,
  },
});

describe("statements flow", () => {
  test("navigates to statements and downloads", async () => {
    await scenario.device.launchApp();
    await scenario.element("Statements tab").expectVisible();
    await scenario.element("Statements tab").tap();
    await scenario.element("Download January 2025 statement").expectVisible();
    await scenario.element("Download January 2025 statement").tap();
    await scenario.element("Download December 2024 statement").expectVisible();
    await scenario.element("Download December 2024 statement").tap();
    await scenario.expectScreen(
      "tabs/statements->Download January 2025 statement->Download December 2024 statement"
    );
  });
});
