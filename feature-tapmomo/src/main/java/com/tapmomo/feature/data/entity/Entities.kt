package com.tapmomo.feature.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Index
import java.util.UUID

/**
 * Transaction entity for Room database
 */
@Entity(
    tableName = "transactions",
    indices = [
        Index(value = ["created_at"]),
        Index(value = ["status"]),
        Index(value = ["merchant_id"])
    ]
)
data class TransactionEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    
    val created_at: Long = System.currentTimeMillis(),
    
    /**
     * Role: "payee" (receiving) or "payer" (sending)
     */
    val role: String,
    
    val network: String,
    
    val merchant_id: String,
    
    val amount: Int?,
    
    val currency: String,
    
    val ref: String?,
    
    val nonce: String,
    
    /**
     * Status: "pending", "settled", "failed"
     */
    val status: String = "pending",
    
    /**
     * SIM slot index for dual-SIM devices
     */
    val sim_slot: Int? = null,
    
    val notes: String? = null
)

/**
 * Seen nonces for replay protection
 */
@Entity(
    tableName = "seen_nonces",
    indices = [Index(value = ["seen_at"])]
)
data class SeenNonceEntity(
    @PrimaryKey
    val nonce: String,
    
    val seen_at: Long = System.currentTimeMillis()
)
