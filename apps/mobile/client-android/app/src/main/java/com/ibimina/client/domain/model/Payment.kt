package com.ibimina.client.domain.model

/**
 * Domain entity representing a payment transaction
 */
data class Payment(
    val id: String,
    val amount: Double,
    val reference: String,
    val merchantCode: String,
    val network: String, // MTN or Airtel
    val timestamp: Long,
    val status: PaymentStatus,
    val groupId: String? = null,
    val memberId: String? = null,
    val hmacSignature: String? = null,
    val nonce: String? = null,
    val ttl: Long? = null
)

enum class PaymentStatus {
    INITIATED,
    PENDING,
    SETTLED,
    FAILED,
    CANCELLED
}
