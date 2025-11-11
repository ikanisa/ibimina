package com.ibimina.client.domain.repository

import com.ibimina.client.domain.model.Group
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for group operations
 */
interface GroupRepository {
    /**
     * Get all groups for a user
     */
    suspend fun getUserGroups(userId: String): Flow<List<Group>>
    
    /**
     * Get a single group by ID
     */
    suspend fun getGroupById(groupId: String): Group?
    
    /**
     * Join a group
     */
    suspend fun joinGroup(groupId: String, userId: String): Result<Unit>
    
    /**
     * Leave a group
     */
    suspend fun leaveGroup(groupId: String, userId: String): Result<Unit>
    
    /**
     * Sync groups with remote server
     */
    suspend fun syncGroups(): Result<Unit>
}
