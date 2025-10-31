package com.tapmomo.feature.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.tapmomo.feature.data.dao.SeenNonceDao
import com.tapmomo.feature.data.dao.TransactionDao
import com.tapmomo.feature.data.entity.SeenNonceEntity
import com.tapmomo.feature.data.entity.TransactionEntity

/**
 * Room database for TapMoMo library
 */
@Database(
    entities = [
        TransactionEntity::class,
        SeenNonceEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class TapMoMoDatabase : RoomDatabase() {
    
    abstract fun transactionDao(): TransactionDao
    abstract fun seenNonceDao(): SeenNonceDao
    
    companion object {
        @Volatile
        private var INSTANCE: TapMoMoDatabase? = null
        
        fun getInstance(context: Context): TapMoMoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TapMoMoDatabase::class.java,
                    "tapmomo_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
