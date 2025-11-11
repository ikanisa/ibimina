package com.ibimina.client.data.remote.dto

import com.ibimina.client.domain.model.Transaction
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TransactionDto(
    val id: String,
    val amount: Double,
    val reference: String,
    val status: String,
    @SerialName("created_at") val createdAt: String
) {
    fun toDomain(): Transaction = Transaction(
        id = id,
        amount = amount,
        reference = reference,
        status = status,
        createdAt = createdAt
    )
}
