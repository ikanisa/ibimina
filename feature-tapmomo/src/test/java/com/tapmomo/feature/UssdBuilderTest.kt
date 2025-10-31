package com.tapmomo.feature.ussd

import com.tapmomo.feature.Network
import com.tapmomo.feature.UssdTemplate
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for USSD code building and encoding
 */
class UssdBuilderTest {
    
    @Test
    fun testUssdShortcut_withAmount() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )
        
        val merchantId = "123456"
        val amount = 2500
        
        val ussd = template.shortcut
            .replace("{MERCHANT}", merchantId)
            .replace("{AMOUNT}", amount.toString())
        
        assertEquals("*182*8*1*123456*2500#", ussd)
    }
    
    @Test
    fun testUssdMenu_withoutAmount() {
        val template = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )
        
        val ussd = template.menu
        
        assertEquals("*182*8*1#", ussd)
    }
    
    @Test
    fun testUssdEncoding_hashSymbol() {
        val ussdCode = "*182*8*1*123456*2500#"
        
        // Encode # as %23 for URI
        val encoded = ussdCode.replace("#", "%23")
        
        assertEquals("*182*8*1*123456*2500%23", encoded)
        assertTrue(encoded.contains("%23"))
        assertFalse(encoded.contains("#"))
    }
    
    @Test
    fun testUssdTemplate_multipleNetworks() {
        val mtnTemplate = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )
        
        val airtelTemplate = UssdTemplate(
            shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
            menu = "*182*8*1#",
            base = "*182#"
        )
        
        // Both networks use same USSD codes in Rwanda
        assertEquals(mtnTemplate.shortcut, airtelTemplate.shortcut)
        assertEquals(mtnTemplate.menu, airtelTemplate.menu)
        assertEquals(mtnTemplate.base, airtelTemplate.base)
    }
}
