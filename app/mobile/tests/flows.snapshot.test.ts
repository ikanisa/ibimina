import { describe, expect, test } from "@jest/globals";
import { getNativeWindTheme } from "../src/theme/nativewind";

interface FlowStep {
  id: string;
  title: string;
  a11yLabel: string;
}

const onboardingSteps: FlowStep[] = [
  { id: "welcome", title: "Welcome", a11yLabel: "Welcome to Ibimina" },
  { id: "permissions", title: "Notifications", a11yLabel: "Enable notifications" },
  { id: "finish", title: "Get Started", a11yLabel: "Continue to home" },
];

const paymentSteps: FlowStep[] = [
  { id: "pay", title: "Pay Tab", a11yLabel: "Pay tab" },
  { id: "dial", title: "Dial", a11yLabel: "Dial USSD" },
  { id: "confirm", title: "Confirmation", a11yLabel: "Confirm payment" },
];

const statementSteps: FlowStep[] = [
  { id: "landing", title: "Statements", a11yLabel: "Statements tab" },
  { id: "download", title: "Download", a11yLabel: "Download PDF" },
  { id: "complete", title: "Saved", a11yLabel: "Saved to device" },
];

describe("nativewind theme snapshots", () => {
  test("onboarding, payments, and statements share a11y guards", () => {
    const lightTheme = getNativeWindTheme("light");
    const darkTheme = getNativeWindTheme("dark");

    expect({
      light: lightTheme.classes,
      dark: darkTheme.classes,
      flows: {
        onboarding: onboardingSteps,
        payments: paymentSteps,
        statements: statementSteps,
      },
    }).toMatchSnapshot();
  });
});
