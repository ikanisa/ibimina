package com.ibimina.client.data.local.dao

import androidx.room.*
import com.ibimina.client.data.local.entity.GroupEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface GroupDao {
    @Query("SELECT * FROM groups WHERE isActive = 1")
    fun observeAll(): Flow<List<GroupEntity>>
    
    @Query("SELECT * FROM groups WHERE isActive = 1")
    suspend fun getAll(): List<GroupEntity>
    
    @Query("SELECT * FROM groups WHERE id = :id")
    suspend fun getById(id: String): GroupEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(groups: List<GroupEntity>)
    
    @Delete
    suspend fun delete(group: GroupEntity)
}
