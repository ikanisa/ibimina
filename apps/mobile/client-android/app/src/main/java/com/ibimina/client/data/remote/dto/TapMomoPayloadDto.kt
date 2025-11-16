package com.ibimina.client.data.remote.dto

import com.ibimina.client.domain.model.NFCPayload
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@Serializable
data class TapMomoPayloadDto(
    @SerialName("merchant_id") val merchantId: String,
    val network: String,
    val amount: Double,
    val currency: String = "RWF",
    val ref: String? = null,
    val status: String = "initiated",
    val nonce: String,
    @SerialName("ttl_seconds") val ttlSeconds: Long,
    @SerialName("expires_at") val expiresAt: String,
    @SerialName("payload_signature") val payloadSignature: String
) {
    companion object {
        private val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        fun fromDomain(payload: NFCPayload): TapMomoPayloadDto {
            return TapMomoPayloadDto(
                merchantId = payload.merchantId,
                network = payload.network,
                amount = payload.amount,
                ref = payload.reference,
                nonce = payload.nonce,
                ttlSeconds = payload.ttl,
                expiresAt = formatter.format(Date(payload.expiresAt() * 1000)),
                payloadSignature = payload.hmacSignature
            )
        }
    }
}

@Serializable
data class TapMomoPayloadExhaustionDto(
    val status: String = "pending",
    @SerialName("is_exhausted") val isExhausted: Boolean = true,
    @SerialName("exhausted_at") val exhaustedAt: String
)
