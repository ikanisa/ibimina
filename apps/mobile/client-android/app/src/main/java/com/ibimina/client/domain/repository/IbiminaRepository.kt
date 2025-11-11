package com.ibimina.client.domain.repository

import com.ibimina.client.domain.model.AllocationRequest
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.Transaction
import kotlinx.coroutines.flow.Flow

interface IbiminaRepository {
    fun observeGroups(userId: String): Flow<List<Group>>
    fun observeTransactions(userId: String): Flow<List<Transaction>>
    suspend fun refreshGroups(userId: String)
    suspend fun refreshTransactions(userId: String)
    suspend fun createAllocation(allocation: AllocationRequest)
}
