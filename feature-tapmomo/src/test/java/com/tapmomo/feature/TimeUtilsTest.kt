package com.tapmomo.feature.core

import org.junit.Assert.*
import org.junit.Test
import com.tapmomo.feature.data.models.PaymentPayload

/**
 * Unit tests for TimeUtils
 */
class TimeUtilsTest {
    
    @Test
    fun testIsWithinTtl_recentTimestamp() {
        val recentTimestamp = System.currentTimeMillis() - 1000 // 1 second ago
        
        val result = TimeUtils.isWithinTtl(recentTimestamp, 60_000)
        
        assertTrue(result)
    }
    
    @Test
    fun testIsWithinTtl_expiredTimestamp() {
        val expiredTimestamp = System.currentTimeMillis() - 130_000 // 130 seconds ago
        
        val result = TimeUtils.isWithinTtl(expiredTimestamp, 120_000)
        
        assertFalse(result)
    }
    
    @Test
    fun testIsWithinTtl_futureTimestamp() {
        val futureTimestamp = System.currentTimeMillis() + 10_000 // 10 seconds in future
        
        val result = TimeUtils.isWithinTtl(futureTimestamp, 120_000)
        
        assertFalse(result)
    }
    
    @Test
    fun testValidatePayloadTtl_valid() {
        val payload = PaymentPayload(
            ver = 1,
            network = "MTN",
            merchantId = "123456",
            currency = "RWF",
            ts = System.currentTimeMillis() - 5000, // 5 seconds ago
            nonce = "test-nonce"
        )
        
        val result = TimeUtils.validatePayloadTtl(payload)
        
        assertTrue(result)
    }
    
    @Test
    fun testValidatePayloadTtl_expired() {
        val payload = PaymentPayload(
            ver = 1,
            network = "MTN",
            merchantId = "123456",
            currency = "RWF",
            ts = System.currentTimeMillis() - 130_000, // 130 seconds ago
            nonce = "test-nonce"
        )
        
        val result = TimeUtils.validatePayloadTtl(payload)
        
        assertFalse(result)
    }
    
    @Test
    fun testGetRemainingTtl() {
        val timestamp = System.currentTimeMillis() - 10_000 // 10 seconds ago
        val maxTtl = 60_000L // 60 seconds
        
        val remaining = TimeUtils.getRemainingTtl(timestamp, maxTtl)
        
        assertTrue(remaining > 45_000 && remaining <= 50_000) // Approximately 50 seconds
    }
    
    @Test
    fun testGetRemainingTtl_expired() {
        val timestamp = System.currentTimeMillis() - 70_000 // 70 seconds ago
        val maxTtl = 60_000L
        
        val remaining = TimeUtils.getRemainingTtl(timestamp, maxTtl)
        
        assertEquals(0L, remaining)
    }
    
    @Test
    fun testFormatCountdown() {
        assertEquals("01:00", TimeUtils.formatCountdown(60_000))
        assertEquals("00:30", TimeUtils.formatCountdown(30_000))
        assertEquals("02:05", TimeUtils.formatCountdown(125_000))
        assertEquals("00:00", TimeUtils.formatCountdown(0))
    }
    
    @Test
    fun testNowMillis() {
        val before = System.currentTimeMillis()
        val now = TimeUtils.nowMillis()
        val after = System.currentTimeMillis()
        
        assertTrue(now >= before && now <= after)
    }
}
