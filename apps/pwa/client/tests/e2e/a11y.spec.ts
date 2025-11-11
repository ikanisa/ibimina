import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    axe?: {
      run: (
        context?: unknown,
        options?: {
          runOnly?: {
            type: "tag";
            values: string[];
          };
        }
      ) => Promise<{
        violations: Array<{
          id: string;
          description: string;
          impact?: string;
          helpUrl?: string;
          nodes: Array<{
            html: string;
            target: string[];
          }>;
        }>;
      }>;
    };
  }
}

const ROUTES_TO_TEST = ["/", "/home", "/statements", "/pay"] as const;

ROUTES_TO_TEST.forEach((route) => {
  test.describe(`accessibility audit for ${route}`, () => {
    test(`should have no detectable axe issues`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.0/axe.min.js" });

      const results = await page.evaluate(async () => {
        if (!window.axe) {
          throw new Error("axe-core failed to load");
        }

        return window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa"],
          },
        });
      });

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
