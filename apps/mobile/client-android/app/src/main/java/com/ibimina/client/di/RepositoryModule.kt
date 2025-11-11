package com.ibimina.client.di

import com.ibimina.client.data.repository.IbiminaRepositoryImpl
import com.ibimina.client.domain.repository.IbiminaRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import com.ibimina.client.data.repository.GroupRepositoryImpl
import com.ibimina.client.data.repository.TransactionRepositoryImpl
import com.ibimina.client.domain.repository.GroupRepository
import com.ibimina.client.domain.repository.TransactionRepository
import javax.inject.Singleton

/**
 * Hilt module for providing repository implementations
 * 
 * Binds repository interfaces to their implementations.
 */
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    
    @Provides
    @Singleton
    fun provideGroupRepository(
        impl: GroupRepositoryImpl
    ): GroupRepository = impl
    
    @Provides
    @Singleton
    fun provideTransactionRepository(
        impl: TransactionRepositoryImpl
    ): TransactionRepository = impl
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindIbiminaRepository(impl: IbiminaRepositoryImpl): IbiminaRepository
}
