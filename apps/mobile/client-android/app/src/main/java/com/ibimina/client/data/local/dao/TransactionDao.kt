package com.ibimina.client.data.local.dao

import androidx.room.*
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ibimina.client.data.local.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions WHERE groupId = :groupId ORDER BY timestamp DESC")
    fun observeByGroup(groupId: String): Flow<List<TransactionEntity>>
    
    @Query("SELECT * FROM transactions WHERE groupId = :groupId ORDER BY timestamp DESC")
    suspend fun getByGroup(groupId: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE reference = :reference LIMIT 1")
    suspend fun getByReference(reference: String): TransactionEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(transaction: TransactionEntity): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<TransactionEntity>)
    @Query("SELECT * FROM transactions ORDER BY datetime(created_at) DESC")
    fun observeTransactions(): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransactions(transactions: List<TransactionEntity>)

    @Query("DELETE FROM transactions")
    suspend fun clear()
}
