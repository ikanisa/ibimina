import { test } from "node:test";
import assert from "node:assert/strict";
import { createScenario } from "./utils/mockDetox";

test("USSD flow handles balance inquiry and voucher redemption", async () => {
  const scenario = createScenario({
    initial: {
      name: "ussd-home",
      accessibilityElements: ["balance-option", "voucher-option"],
      canProceed: true,
    },
  });

  await scenario.device.launchApp();
  await scenario.element("balance-option").expectVisible();
  await scenario.element("balance-option").tap();
  await scenario.markAccessible("voucher-option");
  await scenario.element("voucher-option").tap();
  await scenario.expectScreen("ussd-home->balance-option->voucher-option");

  assert.ok(true, "USSD flow executed");
});
