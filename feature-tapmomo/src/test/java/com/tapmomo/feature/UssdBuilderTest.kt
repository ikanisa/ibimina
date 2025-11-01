package com.tapmomo.feature.ussd

import com.tapmomo.feature.UssdTemplate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * Unit tests for USSD code building and encoding
 */
class UssdBuilderTest {
    
    @Test
    fun `buildUssdCode uses shortcut when amount provided`() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        val result = UssdLauncher.buildUssdCode(template, " 123456 ", 2500, useShortcut = true)

        assertEquals("*182*8*1*123456*2500#", result)
    }

    @Test
    fun `buildUssdCode falls back to menu when amount missing`() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        val result = UssdLauncher.buildUssdCode(template, "merchant", null, useShortcut = true)

        assertEquals("*182*8*1#", result)
    }

    @Test
    fun `buildUssdCode treats zero amount as menu`() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        val result = UssdLauncher.buildUssdCode(template, "merchant", 0, useShortcut = true)

        assertEquals("*182*8*1#", result)
    }

    @Test
    fun `buildUssdCode throws for negative amount`() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        try {
            UssdLauncher.buildUssdCode(template, "merchant", -10, useShortcut = true)
            fail("Expected IllegalArgumentException")
        } catch (expected: IllegalArgumentException) {
            assertTrue(expected.message!!.contains("Amount"))
        }
    }

    @Test
    fun `ussd preview encodes merchant placeholder`() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        val preview = UssdLauncher.getUssdPreview(
            network = com.tapmomo.feature.Network.MTN,
            merchantId = " 98765 ",
            amount = 1200
        )

        assertTrue(preview.contains("98765"))
        assertFalse(preview.contains(" 98765 "))
    }

    @Test
    fun testUssdTemplateBundleExpiry() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )

        val bundle = UssdTemplateBundle.from(
            version = "test-version",
            ttlSeconds = 30,
            templates = mapOf(Network.MTN to template),
            fetchedAtMs = System.currentTimeMillis() - 120_000
        )

        assertTrue(bundle.isExpired())
    }
}
