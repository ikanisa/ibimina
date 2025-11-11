package com.ibimina.client.di

import com.ibimina.client.data.nfc.NFCManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NfcModule {

    @Provides
    @Singleton
    fun provideNfcManager(): NFCManager = NFCManager()
}
