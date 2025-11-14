package com.ibimina.client.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.TransactionDao
import com.ibimina.client.data.local.entity.GroupEntity
import com.ibimina.client.data.local.entity.TransactionEntity

/**
 * Room database for offline data storage
 */
@Database(
    entities = [
        GroupEntity::class,
        TransactionEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun groupDao(): GroupDao
    abstract fun transactionDao(): TransactionDao
}
