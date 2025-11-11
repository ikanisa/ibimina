package com.ibimina.client.domain.model

/**
 * Domain model for a Group (Ikimina)
 */
data class Group(
    val id: String,
    val orgId: String,
    val countryId: String,
    val name: String,
    val amount: Double,
    val frequency: String,
    val cycle: String,
    val memberCount: Int = 0,
    val isActive: Boolean = true
)

/**
 * Domain model for a Group Member
 */
data class GroupMember(
    val id: String,
    val groupId: String,
    val userId: String,
    val memberCode: String,
    val fullName: String?,
    val phone: String?,
    val status: MemberStatus,
    val joinedAt: Long
)

enum class MemberStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}

/**
 * Domain model for a Transaction
 */
data class Transaction(
    val id: String,
    val groupId: String,
    val memberId: String,
    val amount: Double,
    val reference: String,
    val status: TransactionStatus,
    val source: TransactionSource,
    val timestamp: Long,
    val createdAt: Long
)

enum class TransactionStatus {
    PENDING,
    SETTLED,
    FAILED
}

enum class TransactionSource {
    USSD,
    NFC,
    MANUAL
}

/**
 * Domain model for NFC Payment Payload
 */
data class NFCPaymentPayload(
    val version: String,
    val merchantId: String,
    val network: String,
    val amount: Double,
    val reference: String?,
    val timestamp: Long,
    val nonce: String,
    val signature: String,
    val expiresAt: Long
) {
    fun isExpired(): Boolean = System.currentTimeMillis() > expiresAt
    fun isValid(): Boolean = !isExpired() && signature.isNotEmpty()
}
