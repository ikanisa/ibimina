package com.tapmomo.feature.core

import com.ibimina.tapmomo.proto.TapMoMoValidator
import com.tapmomo.feature.data.models.PaymentPayload
import java.util.concurrent.TimeUnit

/**
 * Time and TTL validation utilities
 */
object TimeUtils {

    /**
     * Maximum allowed TTL for payment requests (2 minutes)
     */
    private const val MAX_TTL_MS = TapMoMoValidator.DEFAULT_TTL_MS

    /**
     * Validate if a timestamp is within acceptable TTL
     */
    fun isWithinTtl(timestamp: Long, maxTtlMs: Long = MAX_TTL_MS): Boolean {
        return TapMoMoValidator.isTimestampWithinTtl(timestamp, ttlMillis = maxTtlMs)
    }

    /**
     * Validate payment payload TTL
     */
    fun validatePayloadTtl(payload: PaymentPayload, maxTtlMs: Long = MAX_TTL_MS): Boolean {
        return isWithinTtl(payload.ts, maxTtlMs)
    }

    /**
     * Get remaining TTL in milliseconds
     */
    fun getRemainingTtl(timestamp: Long, maxTtlMs: Long = MAX_TTL_MS): Long {
        val now = System.currentTimeMillis()
        val age = now - timestamp
        return (maxTtlMs - age).coerceAtLeast(0)
    }

    /**
     * Format milliseconds as MM:SS
     */
    fun formatCountdown(millis: Long): String {
        val totalSeconds = TimeUnit.MILLISECONDS.toSeconds(millis)
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return String.format("%02d:%02d", minutes, seconds)
    }

    /**
     * Get current epoch milliseconds
     */
    fun nowMillis(): Long = System.currentTimeMillis()
}
