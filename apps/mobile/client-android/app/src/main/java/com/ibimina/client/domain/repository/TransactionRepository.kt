package com.ibimina.client.domain.repository

import com.ibimina.client.domain.model.Transaction
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for Transaction-related operations
 * 
 * Handles payment transactions, allocations, and history.
 */
interface TransactionRepository {
    
    /**
     * Get all transactions for a specific group
     */
    suspend fun getTransactionsByGroup(groupId: String): Result<List<Transaction>>
    
    /**
     * Get all transactions for the current user
     */
    suspend fun getUserTransactions(): Result<List<Transaction>>
    
    /**
     * Observe transactions as a Flow for real-time updates
     */
    fun observeTransactions(groupId: String): Flow<List<Transaction>>
    
    /**
     * Create a new transaction from NFC payment
     */
    suspend fun createTransaction(transaction: Transaction): Result<Transaction>
    
    /**
     * Sync transactions from server
     */
    suspend fun syncTransactions(): Result<Unit>
    
    /**
     * Get transaction by reference code
     */
    suspend fun getTransactionByReference(reference: String): Result<Transaction?>
}
