package com.ibimina.client.data.remote.dto

import com.ibimina.client.domain.model.Transaction
import com.ibimina.client.domain.model.TransactionSource
import com.ibimina.client.domain.model.TransactionStatus
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TransactionDto(
    val id: String,
    @SerialName("group_id") val groupId: String? = null,
    @SerialName("member_id") val memberId: String? = null,
    val amount: Double,
    val reference: String,
    val status: String,
    val source: String? = null,
    val timestamp: Long = 0L,
    @SerialName("created_at") val createdAt: String
) {
    fun toDomain(): Transaction = Transaction(
        id = id,
        groupId = groupId,
        memberId = memberId,
        amount = amount,
        reference = reference,
        status = status.toTransactionStatus(),
        source = (source ?: "MANUAL").toTransactionSource(),
        timestamp = timestamp,
        createdAt = createdAt
    )
}

private fun String.toTransactionStatus(): TransactionStatus = runCatching {
    TransactionStatus.valueOf(uppercase())
}.getOrDefault(TransactionStatus.PENDING)

private fun String.toTransactionSource(): TransactionSource = runCatching {
    TransactionSource.valueOf(uppercase())
}.getOrDefault(TransactionSource.MANUAL)
