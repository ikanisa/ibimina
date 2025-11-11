package com.ibimina.client.di

import android.content.Context
import androidx.room.Room
import com.ibimina.client.data.local.IbiminaDatabase
import com.ibimina.client.data.local.dao.GroupDao
import com.ibimina.client.data.local.dao.PaymentDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module for database dependencies
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): IbiminaDatabase {
        return Room.databaseBuilder(
            context,
            IbiminaDatabase::class.java,
            IbiminaDatabase.DATABASE_NAME
        ).build()
    }
    
    @Provides
    @Singleton
    fun providePaymentDao(database: IbiminaDatabase): PaymentDao {
        return database.paymentDao()
    }
    
    @Provides
    @Singleton
    fun provideGroupDao(database: IbiminaDatabase): GroupDao {
        return database.groupDao()
    }
}
