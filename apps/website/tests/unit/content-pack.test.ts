import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getWebsiteContentPack } from "@/lib/content";

describe("website content pack", () => {
  it("returns a merged pack for the default locale", () => {
    const pack = getWebsiteContentPack();

    assert.equal(pack.countryISO3, "RWA");
    assert.ok(pack.ussd.providers.length > 0);
    assert.ok(pack.help.paymentGuide.length > 0);
  });
});
