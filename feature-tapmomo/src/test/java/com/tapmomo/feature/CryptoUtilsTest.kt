package com.tapmomo.feature.core

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for CryptoUtils
 */
class CryptoUtilsTest {
    
    @Test
    fun testHmacSha256_generatesSignature() {
        val message = "test message"
        val secret = "test-secret-key"
        
        val signature = CryptoUtils.hmacSha256(message, secret)
        
        assertNotNull(signature)
        assertTrue(signature.isNotEmpty())
    }
    
    @Test
    fun testHmacSha256_consistentResults() {
        val message = "test message"
        val secret = "test-secret-key"
        
        val signature1 = CryptoUtils.hmacSha256(message, secret)
        val signature2 = CryptoUtils.hmacSha256(message, secret)
        
        assertEquals(signature1, signature2)
    }
    
    @Test
    fun testHmacSha256_differentSecrets_differentSignatures() {
        val message = "test message"
        val secret1 = "secret1"
        val secret2 = "secret2"
        
        val signature1 = CryptoUtils.hmacSha256(message, secret1)
        val signature2 = CryptoUtils.hmacSha256(message, secret2)
        
        assertNotEquals(signature1, signature2)
    }
    
    @Test
    fun testVerifyHmacSha256_validSignature() {
        val message = "test message"
        val secret = "test-secret-key"
        val signature = CryptoUtils.hmacSha256(message, secret)
        
        val isValid = CryptoUtils.verifyHmacSha256(message, signature, secret)
        
        assertTrue(isValid)
    }
    
    @Test
    fun testVerifyHmacSha256_invalidSignature() {
        val message = "test message"
        val secret = "test-secret-key"
        val invalidSignature = "invalid-signature"
        
        val isValid = CryptoUtils.verifyHmacSha256(message, invalidSignature, secret)
        
        assertFalse(isValid)
    }
    
    @Test
    fun testVerifyHmacSha256_wrongSecret() {
        val message = "test message"
        val secret = "correct-secret"
        val wrongSecret = "wrong-secret"
        val signature = CryptoUtils.hmacSha256(message, secret)
        
        val isValid = CryptoUtils.verifyHmacSha256(message, signature, wrongSecret)
        
        assertFalse(isValid)
    }
    
    @Test
    fun testCreateSignableMessage_allFields() {
        val message = CryptoUtils.createSignableMessage(
            ver = 1,
            network = "MTN",
            merchantId = "123456",
            currency = "RWF",
            amount = 2500,
            ref = "REF123",
            ts = 1698765432000,
            nonce = "test-nonce"
        )
        
        assertTrue(message.contains("ver=1"))
        assertTrue(message.contains("network=MTN"))
        assertTrue(message.contains("merchantId=123456"))
        assertTrue(message.contains("currency=RWF"))
        assertTrue(message.contains("amount=2500"))
        assertTrue(message.contains("ref=REF123"))
        assertTrue(message.contains("ts=1698765432000"))
        assertTrue(message.contains("nonce=test-nonce"))
    }
    
    @Test
    fun testCreateSignableMessage_optionalFields() {
        val message = CryptoUtils.createSignableMessage(
            ver = 1,
            network = "MTN",
            merchantId = "123456",
            currency = "RWF",
            amount = null,
            ref = null,
            ts = 1698765432000,
            nonce = "test-nonce"
        )
        
        assertTrue(message.contains("ver=1"))
        assertFalse(message.contains("amount="))
        assertFalse(message.contains("ref="))
    }
}
