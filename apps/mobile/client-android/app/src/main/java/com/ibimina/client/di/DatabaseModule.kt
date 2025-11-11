package com.ibimina.client.di

import android.content.Context
import androidx.room.Room
import com.ibimina.client.data.local.IbiminaDatabase
import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import com.ibimina.client.data.local.AppDatabase
import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.TransactionDao
import javax.inject.Singleton

/**
 * Hilt module for providing database-related dependencies
 * 
 * Provides Room database and DAOs for offline support.
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ibimina_client_db"
        )
            .fallbackToDestructiveMigration()
            .build()
            IbiminaDatabase::class.java,
            "ibimina.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    @Singleton
    fun provideGroupDao(database: AppDatabase): GroupDao {
        return database.groupDao()
    }
    
    @Provides
    @Singleton
    fun provideTransactionDao(database: AppDatabase): TransactionDao {
        return database.transactionDao()
    }
    fun provideGroupDao(database: IbiminaDatabase): GroupDao = database.groupDao()

    @Provides
    fun provideTransactionDao(database: IbiminaDatabase): TransactionDao = database.transactionDao()
}
