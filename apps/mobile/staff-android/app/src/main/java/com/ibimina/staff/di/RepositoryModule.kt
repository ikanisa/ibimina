package com.ibimina.staff.di

import com.ibimina.staff.data.momo.InMemoryMomoTransactionRepository
import com.ibimina.staff.data.momo.MomoTransactionRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindMomoTransactionRepository(
        impl: InMemoryMomoTransactionRepository
    ): MomoTransactionRepository
}
