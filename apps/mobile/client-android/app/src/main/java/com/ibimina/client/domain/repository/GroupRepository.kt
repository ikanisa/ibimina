package com.ibimina.client.domain.repository

import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.GroupMember
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for Group-related operations
 * 
 * Follows Clean Architecture principles by defining the contract
 * in the domain layer while implementation lives in the data layer.
 */
interface GroupRepository {
    
    /**
     * Get all groups for the current user
     */
    suspend fun getGroups(): Result<List<Group>>
    
    /**
     * Get a specific group by ID
     */
    suspend fun getGroupById(groupId: String): Result<Group>
    
    /**
     * Observe groups as a Flow for real-time updates
     */
    fun observeGroups(): Flow<List<Group>>
    
    /**
     * Get members of a specific group
     */
    suspend fun getGroupMembers(groupId: String): Result<List<GroupMember>>
    
    /**
     * Sync groups from server
     */
    suspend fun syncGroups(): Result<Unit>
}
