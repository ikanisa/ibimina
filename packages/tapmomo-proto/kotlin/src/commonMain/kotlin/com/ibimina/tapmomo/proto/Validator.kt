package com.ibimina.tapmomo.proto

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * TTL and nonce replay protections shared across clients.
 */
object TapMoMoValidator {
    const val DEFAULT_TTL_MS: Long = 120_000

    fun isTimestampWithinTtl(
        timestampMillis: Long,
        ttlMillis: Long = DEFAULT_TTL_MS,
        now: Instant = Clock.System.now(),
    ): Boolean {
        val age = now.toEpochMilliseconds() - timestampMillis
        return age in 0..ttlMillis
    }
}

/**
 * Simple in-memory nonce cache used for replay detection. Platforms that
 * require persistence can implement their own store while leveraging the
 * same validation rules.
 */
class NonceMemoryStore(private val ttlMillis: Long = TapMoMoValidator.DEFAULT_TTL_MS) {
    private val entries = LinkedHashMap<String, Long>()

    fun purge(nowMillis: Long) {
        val iterator = entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (nowMillis - entry.value > ttlMillis) {
                iterator.remove()
            }
        }
    }

    /**
     * Returns true if the nonce has not been seen within the TTL window and marks it as used.
     */
    fun checkAndStore(nonce: String, timestampMillis: Long, nowMillis: Long = Clock.System.now().toEpochMilliseconds()): Boolean {
        purge(nowMillis)
        val seenAt = entries[nonce]
        if (seenAt != null && nowMillis - seenAt <= ttlMillis) {
            return false
        }
        entries[nonce] = timestampMillis
        return true
    }
}
