package com.ibimina.client.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.PaymentDao
import com.ibimina.client.data.local.entity.GroupEntity
import com.ibimina.client.data.local.entity.PaymentEntity

/**
 * Room database for Ibimina Client
 */
@Database(
    entities = [
        PaymentEntity::class,
        GroupEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class IbiminaDatabase : RoomDatabase() {
    abstract fun paymentDao(): PaymentDao
    abstract fun groupDao(): GroupDao
    
    companion object {
        const val DATABASE_NAME = "ibimina_db"
    }
}
