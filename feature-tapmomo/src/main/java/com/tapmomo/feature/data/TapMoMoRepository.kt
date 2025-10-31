package com.tapmomo.feature.data

import android.content.Context
import com.tapmomo.feature.data.entity.SeenNonceEntity
import com.tapmomo.feature.data.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow
import java.util.concurrent.TimeUnit

/**
 * Repository for transaction and nonce operations
 */
class TapMoMoRepository(context: Context) {
    
    private val database = TapMoMoDatabase.getInstance(context)
    private val transactionDao = database.transactionDao()
    private val nonceDao = database.seenNonceDao()
    
    // Transaction operations
    
    fun getAllTransactions(): Flow<List<TransactionEntity>> {
        return transactionDao.getAllTransactions()
    }
    
    fun getTransactionsByRole(role: String): Flow<List<TransactionEntity>> {
        return transactionDao.getTransactionsByRole(role)
    }
    
    fun getTransactionsByStatus(status: String): Flow<List<TransactionEntity>> {
        return transactionDao.getTransactionsByStatus(status)
    }
    
    suspend fun getTransactionById(id: String): TransactionEntity? {
        return transactionDao.getTransactionById(id)
    }
    
    suspend fun insertTransaction(transaction: TransactionEntity) {
        transactionDao.insertTransaction(transaction)
    }
    
    suspend fun updateTransaction(transaction: TransactionEntity) {
        transactionDao.updateTransaction(transaction)
    }
    
    suspend fun updateTransactionStatus(id: String, status: String) {
        transactionDao.updateTransactionStatus(id, status)
    }
    
    suspend fun deleteTransaction(transaction: TransactionEntity) {
        transactionDao.deleteTransaction(transaction)
    }
    
    // Nonce operations (replay protection)
    
    suspend fun hasSeenNonce(nonce: String): Boolean {
        return nonceDao.hasNonce(nonce)
    }
    
    suspend fun markNonceSeen(nonce: String) {
        nonceDao.insertNonce(SeenNonceEntity(nonce = nonce))
    }
    
    // Cleanup operations
    
    suspend fun cleanupOldData() {
        val tenMinutesAgo = System.currentTimeMillis() - TimeUnit.MINUTES.toMillis(10)
        nonceDao.deleteOldNonces(tenMinutesAgo)
        
        val thirtyDaysAgo = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(30)
        transactionDao.deleteOldTransactions(thirtyDaysAgo)
    }
}
