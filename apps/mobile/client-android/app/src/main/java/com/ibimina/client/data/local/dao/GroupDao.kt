package com.ibimina.client.data.local.dao

import androidx.room.*
import com.ibimina.client.data.local.entity.GroupEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Group operations
 */
@Dao
interface GroupDao {
    @Query("SELECT * FROM groups WHERE isActive = 1 ORDER BY name ASC")
    fun getAllActiveGroups(): Flow<List<GroupEntity>>
    
    @Query("SELECT * FROM groups WHERE id = :groupId")
    suspend fun getGroupById(groupId: String): GroupEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroup(group: GroupEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroups(groups: List<GroupEntity>)
    
    @Update
    suspend fun updateGroup(group: GroupEntity)
    
    @Delete
    suspend fun deleteGroup(group: GroupEntity)
    
    @Query("DELETE FROM groups")
    suspend fun deleteAllGroups()
}
