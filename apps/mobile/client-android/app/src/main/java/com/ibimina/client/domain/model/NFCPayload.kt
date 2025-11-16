package com.ibimina.client.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Domain entity representing an NFC payment payload
 */
@Serializable
data class NFCPayload(
    val amount: Double,
    val network: String,
    @SerialName("merchantId")
    val merchantId: String,
    val reference: String? = null,
    @SerialName("hmacSignature")
    val hmacSignature: String,
    val nonce: String,
    val timestamp: Long,
    val ttl: Long
) {
    fun isExpired(): Boolean {
        val currentTime = System.currentTimeMillis() / 1000
        return currentTime > (timestamp + ttl)
    }

    fun expiresAt(): Long = timestamp + ttl

    fun toJson(): String = Json.encodeToString(this)

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun fromJson(payload: String): NFCPayload? = runCatching {
            json.decodeFromString(serializer(), payload)
        }.getOrNull()
    }
}
