import { describe, expect, test } from "@jest/globals";
import { createScenario } from "./utils/mockDetox";

const scenario = createScenario({
  initial: {
    name: "tabs/pay",
    accessibilityElements: ["Pay tab", "USSD Code", "Dial to Pay"],
    canProceed: true,
  },
});

describe("payments flow", () => {
  test("opens pay tab and executes dial", async () => {
    await scenario.device.launchApp();
    await scenario.element("Pay tab").expectVisible();
    await scenario.element("Pay tab").tap();
    await scenario.markAccessible("Merchant Code");
    await scenario.markAccessible("Reference");
    await scenario.element("Merchant Code").expectVisible();
    await scenario.element("Reference").expectVisible();
    await scenario.element("Dial to Pay").tap();
    await scenario.expectScreen("tabs/pay->Dial to Pay");
  });
});
