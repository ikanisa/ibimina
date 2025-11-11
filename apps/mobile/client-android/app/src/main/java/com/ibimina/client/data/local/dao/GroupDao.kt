package com.ibimina.client.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
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
    @Query("SELECT * FROM groups ORDER BY name ASC")
    fun observeGroups(): Flow<List<GroupEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroups(groups: List<GroupEntity>)

    @Query("DELETE FROM groups")
    suspend fun clear()
}
