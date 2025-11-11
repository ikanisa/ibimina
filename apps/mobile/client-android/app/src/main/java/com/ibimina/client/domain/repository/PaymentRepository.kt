package com.ibimina.client.domain.repository

import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.model.PaymentStatus
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for payment operations
 */
interface PaymentRepository {
    /**
     * Get all payments for a user
     */
    suspend fun getPayments(userId: String): Flow<List<Payment>>
    
    /**
     * Get a single payment by ID
     */
    suspend fun getPaymentById(paymentId: String): Payment?
    
    /**
     * Create a new payment
     */
    suspend fun createPayment(payment: Payment): Result<Payment>
    
    /**
     * Update payment status
     */
    suspend fun updatePaymentStatus(paymentId: String, status: PaymentStatus): Result<Unit>
    
    /**
     * Sync payments with remote server
     */
    suspend fun syncPayments(): Result<Unit>
}
