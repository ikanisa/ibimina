package com.ibimina.client.data

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.Serializable
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
    
    /**
     * Get user's groups (ibimina)
     */
    suspend fun getUserGroups(userId: String): List<Group> {
        return client.from("group_members")
            .select {
                filter {
                    eq("user_id", userId)
                }
            }
            .decodeList<Group>()
    }
    
    /**
     * Get transaction history
     */
    suspend fun getTransactions(userId: String): List<Transaction> {
        return client.from("allocations")
            .select {
                filter {
                    eq("member_id", userId)
                }
                order("created_at", ascending = false)
            }
            .decodeList<Transaction>()
    }
    
    /**
     * Create a new transaction allocation
     */
    suspend fun createAllocation(allocation: AllocationRequest) {
        client.from("allocations")
            .insert(allocation)
    }
}

@Serializable
data class Group(
    val id: String,
    val name: String,
    val group_id: String,
    val member_code: String
)

@Serializable
data class Transaction(
    val id: String,
    val amount: Double,
    val reference: String,
    val status: String,
    val created_at: String
)

@Serializable
data class AllocationRequest(
    val org_id: String,
    val group_id: String,
    val member_id: String,
    val amount: Double,
    val raw_ref: String,
    val source: String
)
