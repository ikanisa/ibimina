package com.ibimina.client.data.repository

import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.GroupMember
import com.ibimina.client.domain.repository.GroupRepository
import io.github.jan.supabase.SupabaseClient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GroupRepositoryImpl @Inject constructor(
    private val groupDao: GroupDao,
    private val supabaseClient: SupabaseClient
) : GroupRepository {
    
    override suspend fun getGroups(): Result<List<Group>> {
        return try {
            val groups = groupDao.getAll().map { it.toDomain() }
            Result.success(groups)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun getGroupById(groupId: String): Result<Group> {
        return try {
            val group = groupDao.getById(groupId)?.toDomain()
            group?.let { Result.success(it) } ?: Result.failure(Exception("Group not found"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override fun observeGroups(): Flow<List<Group>> {
        return groupDao.observeAll().map { entities ->
            entities.map { it.toDomain() }
        }
    }
    
    override suspend fun getGroupMembers(groupId: String): Result<List<GroupMember>> {
        // TODO: Implement with Supabase
        return Result.success(emptyList())
    }
    
    override suspend fun syncGroups(): Result<Unit> {
        // TODO: Sync from Supabase
        return Result.success(Unit)
    }
}

private fun com.ibimina.client.data.local.entity.GroupEntity.toDomain() = Group(
    id = id,
    orgId = orgId,
    countryId = countryId,
    name = name,
    amount = amount,
    frequency = frequency,
    cycle = cycle,
    memberCount = memberCount,
    isActive = isActive
)
