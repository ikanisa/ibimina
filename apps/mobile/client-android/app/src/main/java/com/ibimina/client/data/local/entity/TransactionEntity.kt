package com.ibimina.client.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Transaction
import com.ibimina.client.domain.model.TransactionSource
import com.ibimina.client.domain.model.TransactionStatus

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "group_id") val groupId: String?,
    @ColumnInfo(name = "member_id") val memberId: String?,
    val amount: Double,
    val reference: String,
    val status: String,
    val source: String,
    val timestamp: Long,
    @ColumnInfo(name = "created_at") val createdAt: String
) {
    fun toDomain(): Transaction = Transaction(
        id = id,
        groupId = groupId,
        memberId = memberId,
        amount = amount,
        reference = reference,
        status = status.toTransactionStatus(),
        source = source.toTransactionSource(),
        timestamp = timestamp,
        createdAt = createdAt
    )

    companion object {
        fun fromDomain(transaction: Transaction): TransactionEntity = TransactionEntity(
            id = transaction.id,
            groupId = transaction.groupId,
            memberId = transaction.memberId,
            amount = transaction.amount,
            reference = transaction.reference,
            status = transaction.status.name,
            source = transaction.source.name,
            timestamp = transaction.timestamp,
            createdAt = transaction.createdAt
        )
    }
}

private fun String.toTransactionStatus(): TransactionStatus = runCatching {
    TransactionStatus.valueOf(uppercase())
}.getOrDefault(TransactionStatus.PENDING)

private fun String.toTransactionSource(): TransactionSource = runCatching {
    TransactionSource.valueOf(uppercase())
}.getOrDefault(TransactionSource.MANUAL)
