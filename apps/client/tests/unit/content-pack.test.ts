import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getClientContentPack, resolveClientLocaleCode } from "@/lib/content/pack";

import { locales } from "@/i18n";

describe("client content pack integration", () => {
  it("maps app locales to locale codes", () => {
    for (const locale of locales) {
      const code = resolveClientLocaleCode(locale);
      assert.ok(code.endsWith("-RW") || code === "fr-SN");
    }
  });

  it("provides translated help content for default locale", () => {
    const pack = getClientContentPack();

    assert.equal(pack.countryISO3, "RWA");
    assert.ok(pack.help.paymentGuide.length > 0);
    assert.ok(pack.help.troubleshooting.length > 0);
  });
});
