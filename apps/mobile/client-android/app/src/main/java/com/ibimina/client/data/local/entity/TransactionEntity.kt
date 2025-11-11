package com.ibimina.client.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

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
