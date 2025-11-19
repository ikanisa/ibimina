package com.ibimina.client.data.remote

import com.ibimina.client.data.auth.AuthRepository
import com.ibimina.client.data.remote.dto.AllocationRequestDto
import com.ibimina.client.data.remote.dto.GroupDto
import com.ibimina.client.data.remote.dto.TransactionDto
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.currentSessionOrNull
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.exceptions.UnauthorizedRestException
import io.github.jan.supabase.postgrest.decodeList
import io.github.jan.supabase.postgrest.from
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseService @Inject constructor(
    private val client: SupabaseClient,
    private val authRepository: AuthRepository
) {

    suspend fun fetchUserGroups(userId: String): List<GroupDto> {
        return withAuth {
            client.from("group_members")
                .select {
                    filter {
                        eq("user_id", userId)
                    }
                }
                .decodeList<GroupDto>()
        }
    }

    suspend fun fetchTransactions(userId: String): List<TransactionDto> {
        return withAuth {
            client.from("allocations")
                .select {
                    filter {
                        eq("member_id", userId)
                    }
                    order("created_at", ascending = false)
                }
                .decodeList<TransactionDto>()
        }
    }

    suspend fun createAllocation(request: AllocationRequestDto) {
        withAuth {
            client.from("allocations").insert(request)
        }
    }

    private suspend fun <T> withAuth(block: suspend () -> T): T {
        return try {
            block()
        } catch (error: UnauthorizedRestException) {
            authRepository.refreshSession()
            block()
        }
    }

    suspend fun currentSessionTokens(): Pair<String, String>? {
        val session = client.gotrue.currentSessionOrNull() ?: return null
        val accessToken = session.accessToken
        val refreshToken = session.refreshToken
        if (accessToken.isNullOrBlank() || refreshToken.isNullOrBlank()) return null
        return Pair(accessToken, refreshToken)
    }
}
