package com.ibimina.client.data.repository

import com.ibimina.client.data.local.dao.TransactionDao
import com.ibimina.client.domain.model.Transaction
import com.ibimina.client.domain.model.TransactionStatus
import com.ibimina.client.domain.model.TransactionSource
import com.ibimina.client.domain.repository.TransactionRepository
import io.github.jan.supabase.SupabaseClient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class TransactionRepositoryImpl @Inject constructor(
    private val transactionDao: TransactionDao,
    private val supabaseClient: SupabaseClient
) : TransactionRepository {
    
    override suspend fun getTransactionsByGroup(groupId: String): Result<List<Transaction>> {
        return try {
            val transactions = transactionDao.getByGroup(groupId).map { it.toDomain() }
            Result.success(transactions)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun getUserTransactions(): Result<List<Transaction>> {
        // TODO: Implement with user ID filtering
        return Result.success(emptyList())
    }
    
    override fun observeTransactions(groupId: String): Flow<List<Transaction>> {
        return transactionDao.observeByGroup(groupId).map { entities ->
            entities.map { it.toDomain() }
        }
    }
    
    override suspend fun createTransaction(transaction: Transaction): Result<Transaction> {
        // TODO: Implement transaction creation
        return Result.success(transaction)
    }
    
    override suspend fun syncTransactions(): Result<Unit> {
        // TODO: Sync from Supabase
        return Result.success(Unit)
    }
    
    override suspend fun getTransactionByReference(reference: String): Result<Transaction?> {
        return try {
            val transaction = transactionDao.getByReference(reference)?.toDomain()
            Result.success(transaction)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

private fun com.ibimina.client.data.local.entity.TransactionEntity.toDomain() = Transaction(
    id = id,
    groupId = groupId,
    memberId = memberId,
    amount = amount,
    reference = reference,
    status = TransactionStatus.valueOf(status),
    source = TransactionSource.valueOf(source),
    timestamp = timestamp,
    createdAt = createdAt
)
