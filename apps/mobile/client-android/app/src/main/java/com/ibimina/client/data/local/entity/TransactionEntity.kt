package com.ibimina.client.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Transaction

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    val groupId: String,
    val memberId: String,
    val amount: Double,
    val reference: String,
    val status: String,
    val source: String,
    val timestamp: Long,
    val createdAt: Long
)
    val amount: Double,
    val reference: String,
    val status: String,
    @ColumnInfo(name = "created_at") val createdAt: String
) {
    fun toDomain(): Transaction = Transaction(
        id = id,
        amount = amount,
        reference = reference,
        status = status,
        createdAt = createdAt
    )

    companion object {
        fun fromDomain(transaction: Transaction): TransactionEntity = TransactionEntity(
            id = transaction.id,
            amount = transaction.amount,
            reference = transaction.reference,
            status = transaction.status,
            createdAt = transaction.createdAt
        )
    }
}
