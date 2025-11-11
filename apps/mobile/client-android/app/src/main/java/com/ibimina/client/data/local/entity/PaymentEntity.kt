package com.ibimina.client.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.model.PaymentStatus

/**
 * Room entity for Payment
 */
@Entity(tableName = "payments")
data class PaymentEntity(
    @PrimaryKey val id: String,
    val amount: Double,
    val reference: String,
    val merchantCode: String,
    val network: String,
    val timestamp: Long,
    val status: String,
    val groupId: String?,
    val memberId: String?,
    val hmacSignature: String?,
    val nonce: String?,
    val ttl: Long?
) {
    fun toDomain(): Payment {
        return Payment(
            id = id,
            amount = amount,
            reference = reference,
            merchantCode = merchantCode,
            network = network,
            timestamp = timestamp,
            status = PaymentStatus.valueOf(status),
            groupId = groupId,
            memberId = memberId,
            hmacSignature = hmacSignature,
            nonce = nonce,
            ttl = ttl
        )
    }
    
    companion object {
        fun fromDomain(payment: Payment): PaymentEntity {
            return PaymentEntity(
                id = payment.id,
                amount = payment.amount,
                reference = payment.reference,
                merchantCode = payment.merchantCode,
                network = payment.network,
                timestamp = payment.timestamp,
                status = payment.status.name,
                groupId = payment.groupId,
                memberId = payment.memberId,
                hmacSignature = payment.hmacSignature,
                nonce = payment.nonce,
                ttl = payment.ttl
            )
        }
    }
}
