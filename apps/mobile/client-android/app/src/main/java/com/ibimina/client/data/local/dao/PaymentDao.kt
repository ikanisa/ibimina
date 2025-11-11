package com.ibimina.client.data.local.dao

import androidx.room.*
import com.ibimina.client.data.local.entity.PaymentEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Payment operations
 */
@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments ORDER BY timestamp DESC")
    fun getAllPayments(): Flow<List<PaymentEntity>>
    
    @Query("SELECT * FROM payments WHERE memberId = :userId ORDER BY timestamp DESC")
    fun getPaymentsByUserId(userId: String): Flow<List<PaymentEntity>>
    
    @Query("SELECT * FROM payments WHERE id = :paymentId")
    suspend fun getPaymentById(paymentId: String): PaymentEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: PaymentEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayments(payments: List<PaymentEntity>)
    
    @Update
    suspend fun updatePayment(payment: PaymentEntity)
    
    @Delete
    suspend fun deletePayment(payment: PaymentEntity)
    
    @Query("DELETE FROM payments")
    suspend fun deleteAllPayments()
}
