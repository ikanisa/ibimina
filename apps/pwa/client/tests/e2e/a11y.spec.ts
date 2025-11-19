import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES_TO_TEST = ["/", "/home", "/statements", "/pay", "/groups", "/profile"] as const;

ROUTES_TO_TEST.forEach((route) => {
  test.describe(`accessibility audit for ${route}`, () => {
    test(`should have no detectable axe issues`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

      const violationSummary = results.violations
        .map((violation) => {
          const impactedNodes = violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(" > ") || node.html)
            .join(" | ");
          return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.description} -> ${impactedNodes}`;
        })
        .join("\n");

      expect(
        results.violations,
        violationSummary || `No accessibility violations detected on ${route}`
      ).toEqual([]);
    });
  });
});
