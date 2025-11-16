package com.ibimina.client.di

import android.content.Context
import com.ibimina.client.BuildConfig
import com.ibimina.client.data.auth.SupabaseSessionManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import javax.inject.Singleton

/**
 * Hilt module for providing network-related dependencies
 * 
 * Provides Supabase client configuration for the entire app.
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideSupabaseClient(
        sessionManager: SupabaseSessionManager
    ): SupabaseClient {
        return createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth) {
                this.sessionManager = sessionManager
            }
            install(Postgrest)
            install(Realtime)
            install(Functions)
        }
    }
}
