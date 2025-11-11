package com.ibimina.client.nfc

import com.ibimina.client.domain.model.NFCPayload
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for NFC operations
 */
class NFCManagerTest {
    
    @Test
    fun `test NFCPayload creation`() {
        val payload = NFCPayload(
            amount = 5000.0,
            network = "MTN",
            merchantId = "MERCHANT123",
            reference = "REF001",
            hmacSignature = "signature",
            nonce = "nonce123",
            timestamp = System.currentTimeMillis() / 1000,
            ttl = 60
        )
        
        assertEquals(5000.0, payload.amount, 0.01)
        assertEquals("MTN", payload.network)
        assertEquals("MERCHANT123", payload.merchantId)
    }
    
    @Test
    fun `test NFCPayload expiration`() {
        val expiredPayload = NFCPayload(
            amount = 5000.0,
            network = "MTN",
            merchantId = "MERCHANT123",
            reference = "REF001",
            hmacSignature = "signature",
            nonce = "nonce123",
            timestamp = (System.currentTimeMillis() / 1000) - 120, // 2 minutes ago
            ttl = 60 // 60 seconds
        )
        
        assertTrue(expiredPayload.isExpired())
    }
    
    @Test
    fun `test NFCPayload not expired`() {
        val validPayload = NFCPayload(
            amount = 5000.0,
            network = "MTN",
            merchantId = "MERCHANT123",
            reference = "REF001",
            hmacSignature = "signature",
            nonce = "nonce123",
            timestamp = System.currentTimeMillis() / 1000,
            ttl = 60
        )
        
        assertFalse(validPayload.isExpired())
    }
    
    @Test
    fun `test NFCPayload JSON serialization`() {
        val payload = NFCPayload(
            amount = 5000.0,
            network = "MTN",
            merchantId = "MERCHANT123",
            reference = "REF001",
            hmacSignature = "signature",
            nonce = "nonce123",
            timestamp = 1234567890,
            ttl = 60
        )
        
        val json = payload.toJson()
        assertTrue(json.contains("\"amount\": 5000.0"))
        assertTrue(json.contains("\"network\": \"MTN\""))
        assertTrue(json.contains("\"merchantId\": \"MERCHANT123\""))
    }
}
