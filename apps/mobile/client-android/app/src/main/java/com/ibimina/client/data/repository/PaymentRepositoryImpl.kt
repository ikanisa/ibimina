package com.ibimina.client.data.repository

import com.ibimina.client.data.local.dao.PaymentDao
import com.ibimina.client.data.local.entity.PaymentEntity
import com.ibimina.client.data.remote.api.IbiminaApi
import com.ibimina.client.data.remote.dto.AllocationDto
import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.model.PaymentStatus
import com.ibimina.client.domain.repository.PaymentRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Implementation of PaymentRepository
 */
class PaymentRepositoryImpl @Inject constructor(
    private val paymentDao: PaymentDao,
    private val api: IbiminaApi
) : PaymentRepository {
    
    override suspend fun getPayments(userId: String): Flow<List<Payment>> {
        return paymentDao.getPaymentsByUserId(userId)
            .map { entities -> entities.map { it.toDomain() } }
    }
    
    override suspend fun getPaymentById(paymentId: String): Payment? {
        return paymentDao.getPaymentById(paymentId)?.toDomain()
    }
    
    override suspend fun createPayment(payment: Payment): Result<Payment> {
        return try {
            // Save locally first
            paymentDao.insertPayment(PaymentEntity.fromDomain(payment))
            
            // Then sync to server
            val dto = AllocationDto(
                orgId = payment.groupId ?: "",
                groupId = payment.groupId ?: "",
                memberId = payment.memberId ?: "",
                amount = payment.amount,
                rawRef = payment.reference,
                source = "nfc"
            )
            
            val response = api.createAllocation(dto)
            if (response.isSuccessful) {
                val responseBody = response.body()
                if (responseBody != null) {
                    val createdPayment = responseBody.toDomain()
                    paymentDao.insertPayment(PaymentEntity.fromDomain(createdPayment))
                    Result.success(createdPayment)
                } else {
                    val pendingPayment = payment.copy(status = PaymentStatus.PENDING)
                    paymentDao.insertPayment(PaymentEntity.fromDomain(pendingPayment))
                    Result.failure(IllegalStateException("Empty response when creating payment"))
                }
            } else {
                val pendingPayment = payment.copy(status = PaymentStatus.PENDING)
                paymentDao.insertPayment(PaymentEntity.fromDomain(pendingPayment))
                val errorMessage = "Failed to create payment: ${response.code()} ${response.message()}"
                Result.failure(IllegalStateException(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun updatePaymentStatus(
        paymentId: String,
        status: PaymentStatus
    ): Result<Unit> {
        return try {
            val payment = paymentDao.getPaymentById(paymentId)
            if (payment != null) {
                val updated = payment.copy(status = status.name)
                paymentDao.updatePayment(updated)
                
                // Sync to server
                api.updateAllocationStatus(paymentId, mapOf("status" to status.name))
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun syncPayments(): Result<Unit> {
        return try {
            // Sync logic would go here
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
