package com.ibimina.client.data.remote.dto

import com.google.gson.annotations.SerializedName
import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.model.PaymentStatus

/**
 * DTO for Payment from API
 */
data class PaymentDto(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("raw_ref") val reference: String,
    @SerializedName("merchant_code") val merchantCode: String,
    @SerializedName("network") val network: String,
    @SerializedName("created_at") val timestamp: Long,
    @SerializedName("status") val status: String,
    @SerializedName("group_id") val groupId: String?,
    @SerializedName("member_id") val memberId: String?,
    @SerializedName("hmac_signature") val hmacSignature: String?,
    @SerializedName("nonce") val nonce: String?,
    @SerializedName("ttl") val ttl: Long?
) {
    fun toDomain(): Payment {
        return Payment(
            id = id,
            amount = amount,
            reference = reference,
            merchantCode = merchantCode,
            network = network,
            timestamp = timestamp,
            status = PaymentStatus.valueOf(status.uppercase()),
            groupId = groupId,
            memberId = memberId,
            hmacSignature = hmacSignature,
            nonce = nonce,
            ttl = ttl
        )
    }
}

/**
 * DTO for creating allocation
 */
data class AllocationDto(
    @SerializedName("org_id") val orgId: String,
    @SerializedName("group_id") val groupId: String,
    @SerializedName("member_id") val memberId: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("raw_ref") val rawRef: String,
    @SerializedName("source") val source: String
)
