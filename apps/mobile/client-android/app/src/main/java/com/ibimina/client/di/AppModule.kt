package com.ibimina.client.di

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.ibimina.client.data.OpenAIService
import com.ibimina.client.data.SupabaseClient
import com.ibimina.client.data.remote.api.QrAuthApi
import com.ibimina.client.service.CameraQrScannerService
import com.ibimina.client.service.DefaultMomoSmsService
import com.ibimina.client.service.MomoSmsService
import com.ibimina.client.service.QRScannerService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder().create()

    @Provides
    @Singleton
    fun provideOpenAIService(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): OpenAIService = OpenAIService(okHttpClient, gson)

    @Provides
    @Singleton
    fun provideQrAuthApi(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): QrAuthApi = QrAuthApi(okHttpClient, gson)

    @Provides
    @Singleton
    fun provideQrScannerService(
        @ApplicationContext context: Context
    ): QRScannerService = CameraQrScannerService(context)

    @Provides
    @Singleton
    fun provideMomoSmsService(): MomoSmsService = DefaultMomoSmsService()
}
