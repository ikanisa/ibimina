package com.ibimina.staff.service

import com.ibimina.staff.BuildConfig
import io.github.jan.supabase.SupabaseClient as KSupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.gotrue.Gotrue
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseClient @Inject constructor() {

    private val client: KSupabaseClient by lazy {
        val url = BuildConfig.SUPABASE_URL.ifEmpty { DEFAULT_URL }
        val key = BuildConfig.SUPABASE_ANON_KEY.ifEmpty { DEFAULT_KEY }

        createSupabaseClient(supabaseUrl = url, supabaseKey = key) {
            install(Gotrue)
            install(Postgrest)
            install(Storage)
            install(Functions)
        }
    }

    fun getClient(): KSupabaseClient = client

    fun isConfigured(): Boolean =
        BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()

    companion object {
        private const val DEFAULT_URL = "https://example.supabase.co"
        private const val DEFAULT_KEY = "public-anon-key"
    }
}
