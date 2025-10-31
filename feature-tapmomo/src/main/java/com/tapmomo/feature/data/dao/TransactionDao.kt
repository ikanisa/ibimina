package com.tapmomo.feature.data.dao

import androidx.room.*
import com.tapmomo.feature.data.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for transaction operations
 */
@Dao
interface TransactionDao {
    
    @Query("SELECT * FROM transactions ORDER BY created_at DESC")
    fun getAllTransactions(): Flow<List<TransactionEntity>>
    
    @Query("SELECT * FROM transactions WHERE role = :role ORDER BY created_at DESC")
    fun getTransactionsByRole(role: String): Flow<List<TransactionEntity>>
    
    @Query("SELECT * FROM transactions WHERE status = :status ORDER BY created_at DESC")
    fun getTransactionsByStatus(status: String): Flow<List<TransactionEntity>>
    
    @Query("SELECT * FROM transactions WHERE id = :id")
    suspend fun getTransactionById(id: String): TransactionEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity)
    
    @Update
    suspend fun updateTransaction(transaction: TransactionEntity)
    
    @Query("UPDATE transactions SET status = :status WHERE id = :id")
    suspend fun updateTransactionStatus(id: String, status: String)
    
    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity)
    
    @Query("DELETE FROM transactions WHERE created_at < :timestamp")
    suspend fun deleteOldTransactions(timestamp: Long)
}
