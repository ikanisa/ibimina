package com.ibimina.client.domain.model

/**
 * Domain entity representing an NFC payment payload
 */
data class NFCPayload(
    val amount: Double,
    val network: String, // MTN or Airtel
    val merchantId: String,
    val reference: String? = null,
    val hmacSignature: String,
    val nonce: String,
    val timestamp: Long,
    val ttl: Long // time-to-live in seconds
) {
    /**
     * Check if this payload has expired
     */
    fun isExpired(): Boolean {
        val currentTime = System.currentTimeMillis() / 1000
        return currentTime > (timestamp + ttl)
    }
    
    /**
     * Serialize to JSON string for NFC transmission
     */
    fun toJson(): String {
        return """
            {
                "amount": $amount,
                "network": "$network",
                "merchantId": "$merchantId",
                "reference": ${reference?.let { "\"$it\"" } ?: "null"},
                "hmacSignature": "$hmacSignature",
                "nonce": "$nonce",
                "timestamp": $timestamp,
                "ttl": $ttl
            }
        """.trimIndent()
    }
}
