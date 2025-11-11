package com.ibimina.client

import com.ibimina.client.domain.model.NFCPaymentPayload
import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for NFC payload validation logic
 */
class NFCPayloadValidationTest {
    
    @Test
    fun payload_isExpired_returnsTrueWhenTimestampPassed() {
        val payload = NFCPaymentPayload(
            version = "1.0",
            merchantId = "TEST123",
            network = "MTN",
            amount = 1000.0,
            reference = "REF123",
            timestamp = System.currentTimeMillis() - 120000, // 2 minutes ago
            nonce = "abc123",
            signature = "sig123",
            expiresAt = System.currentTimeMillis() - 1000 // Expired 1 second ago
        )
        
        assertTrue(payload.isExpired())
    }
    
    @Test
    fun payload_isExpired_returnsFalseWhenTimestampNotPassed() {
        val payload = NFCPaymentPayload(
            version = "1.0",
            merchantId = "TEST123",
            network = "MTN",
            amount = 1000.0,
            reference = "REF123",
            timestamp = System.currentTimeMillis(),
            nonce = "abc123",
            signature = "sig123",
            expiresAt = System.currentTimeMillis() + 60000 // Expires in 1 minute
        )
        
        assertFalse(payload.isExpired())
    }
    
    @Test
    fun payload_isValid_returnsFalseWhenExpired() {
        val payload = NFCPaymentPayload(
            version = "1.0",
            merchantId = "TEST123",
            network = "MTN",
            amount = 1000.0,
            reference = "REF123",
            timestamp = System.currentTimeMillis(),
            nonce = "abc123",
            signature = "sig123",
            expiresAt = System.currentTimeMillis() - 1000
        )
        
        assertFalse(payload.isValid())
    }
    
    @Test
    fun payload_isValid_returnsFalseWhenSignatureEmpty() {
        val payload = NFCPaymentPayload(
            version = "1.0",
            merchantId = "TEST123",
            network = "MTN",
            amount = 1000.0,
            reference = "REF123",
            timestamp = System.currentTimeMillis(),
            nonce = "abc123",
            signature = "",
            expiresAt = System.currentTimeMillis() + 60000
        )
        
        assertFalse(payload.isValid())
    }
}
