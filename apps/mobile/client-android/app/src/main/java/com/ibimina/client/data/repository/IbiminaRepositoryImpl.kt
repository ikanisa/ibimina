package com.ibimina.client.data.repository

import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.TransactionDao
import com.ibimina.client.data.local.entity.GroupEntity
import com.ibimina.client.data.local.entity.TransactionEntity
import com.ibimina.client.data.remote.SupabaseService
import com.ibimina.client.data.remote.dto.AllocationRequestDto
import com.ibimina.client.domain.model.AllocationRequest
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.Transaction
import com.ibimina.client.domain.repository.IbiminaRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

@Singleton
class IbiminaRepositoryImpl @Inject constructor(
    private val supabaseService: SupabaseService,
    private val groupDao: GroupDao,
    private val transactionDao: TransactionDao,
    private val ioDispatcher: CoroutineDispatcher
) : IbiminaRepository {

    override fun observeGroups(userId: String): Flow<List<Group>> {
        return groupDao.observeGroups().map { entities ->
            entities.map(GroupEntity::toDomain)
        }
    }

    override fun observeTransactions(userId: String): Flow<List<Transaction>> {
        return transactionDao.observeTransactions().map { entities ->
            entities.map(TransactionEntity::toDomain)
        }
    }

    override suspend fun refreshGroups(userId: String) {
        withContext(ioDispatcher) {
            val groups = supabaseService.fetchUserGroups(userId).map { it.toDomain() }
            groupDao.clear()
            groupDao.insertGroups(groups.map(GroupEntity.Companion::fromDomain))
        }
    }

    override suspend fun refreshTransactions(userId: String) {
        withContext(ioDispatcher) {
            val transactions = supabaseService.fetchTransactions(userId).map { it.toDomain() }
            transactionDao.clear()
            transactionDao.insertTransactions(transactions.map(TransactionEntity.Companion::fromDomain))
        }
    }

    override suspend fun createAllocation(allocation: AllocationRequest) {
        withContext(ioDispatcher) {
            supabaseService.createAllocation(AllocationRequestDto.fromDomain(allocation))
        }
    }
}
