package com.ibimina.staff.data

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.realtime.Realtime
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Supabase Client for Ibimina Staff App
 * 
 * Provides centralized access to Supabase services:
 * - PostgreSQL database access via Postgrest
 * - Authentication via GoTrue
 * - Real-time subscriptions via Realtime
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
    
    /**
     * Get the Postgrest instance for database operations
     */
    val postgrest get() = client.postgrest
    
    /**
     * Get the Auth instance for authentication operations
     */
    val auth get() = client.auth
    
    /**
     * Get the Realtime instance for real-time subscriptions
     */
    val realtime get() = client.realtime
}
