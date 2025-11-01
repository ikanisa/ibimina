package com.tapmomo.feature.data

import android.content.Context
import com.tapmomo.feature.data.entity.SeenNonceEntity
import com.tapmomo.feature.data.entity.TransactionEntity
import com.tapmomo.feature.data.models.PaymentPayload
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

    suspend fun updateTransactionStatusWithReconcile(
        id: String,
        status: String,
        merchantId: String,
        amount: Int?,
        currency: String
    ): TransactionEntity {
        val existing = transactionDao.getTransactionById(id)
        transactionDao.updateTransactionStatus(id, status)

        amount?.let {
            SupabaseClient.reconcileTransaction(
                transactionId = id,
                merchantId = merchantId,
                amount = it,
                status = status
            )
        }

        return existing?.copy(status = status) ?: TransactionEntity(
            id = id,
            created_at = existing?.created_at ?: System.currentTimeMillis(),
            role = "payer",
            network = existing?.network ?: "",
            merchant_id = merchantId,
            amount = amount,
            currency = currency,
            ref = existing?.ref,
            nonce = existing?.nonce ?: "",
            status = status,
            sim_slot = existing?.sim_slot,
            notes = existing?.notes
        )
    }
    
    suspend fun deleteTransaction(transaction: TransactionEntity) {
        transactionDao.deleteTransaction(transaction)
    }

    suspend fun createPayerTransaction(
        payload: PaymentPayload,
        simSlot: Int?
    ): TransactionEntity {
        val entity = TransactionEntity(
            role = "payer",
            network = payload.network,
            merchant_id = payload.merchantId,
            amount = payload.amount,
            currency = payload.currency,
            ref = payload.ref,
            nonce = payload.nonce,
            status = "pending",
            sim_slot = simSlot
        )

        transactionDao.insertTransaction(entity)

        payload.amount?.let { amount ->
            SupabaseClient.reconcileTransaction(
                transactionId = entity.id,
                merchantId = payload.merchantId,
                amount = amount,
                status = entity.status
            )
        }

        return entity
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
