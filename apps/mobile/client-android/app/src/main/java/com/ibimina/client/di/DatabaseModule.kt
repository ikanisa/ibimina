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
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): IbiminaDatabase {
        return Room.databaseBuilder(
            context,
            IbiminaDatabase::class.java,
            "ibimina.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideGroupDao(database: IbiminaDatabase): GroupDao = database.groupDao()

    @Provides
    fun provideTransactionDao(database: IbiminaDatabase): TransactionDao = database.transactionDao()
}
