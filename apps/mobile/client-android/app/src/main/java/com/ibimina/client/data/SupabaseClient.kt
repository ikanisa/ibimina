package com.ibimina.client.data

import com.ibimina.client.BuildConfig
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.realtime.Realtime
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Supabase Client for Ibimina Client App
 * 
 * Provides access to:
 * - User groups and savings data
 * - Transaction history
 * - Real-time updates
 * - Authentication
 */
@Singleton
class SupabaseClient @Inject constructor() {
    
    private val supabaseUrl = BuildConfig.SUPABASE_URL
    private val supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    
    val client = createSupabaseClient(
        supabaseUrl = supabaseUrl,
        supabaseKey = supabaseKey
    ) {
        install(Postgrest)
        install(Auth)
        install(Realtime)
    }
}
