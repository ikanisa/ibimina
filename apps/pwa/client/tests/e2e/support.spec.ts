// @ts-nocheck

import { expect, test } from "@playwright/test";

async function runAxe(page: Parameters<typeof test>[0]["page"]): Promise<void> {
  await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.0/axe.min.js" });
  const results = await page.evaluate(async () => {
    if (!window.axe) {
      throw new Error("axe-core failed to load");
    }
    const panel =
      document.querySelector("#support-assistant-panel") ??
      document.querySelector('[role="region"][aria-label*="assistant"]');
    return window.axe.run(panel ?? document.body, {
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

  expect(results.violations, violationSummary || "No accessibility violations detected").toEqual(
    []
  );
}

test.describe("support assistant toggle", () => {
  test("allows keyboard toggling and passes axe audit", async ({ page }) => {
    await page.goto("/support");

    const toggle = page.getByRole("button", { name: /assistant/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const assistantPanel = page.locator('[role="region"][aria-label*="assistant"]');
    await expect(assistantPanel).toHaveCount(1);
    await expect(assistantPanel).toBeVisible();

    await runAxe(page);

    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(assistantPanel).toHaveCount(0);

    await page.keyboard.press("Shift+A");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(assistantPanel).toHaveCount(1);
    await expect(assistantPanel).toBeVisible();
  });
});
