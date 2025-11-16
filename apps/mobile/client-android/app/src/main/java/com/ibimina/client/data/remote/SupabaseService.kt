package com.ibimina.client.data.remote

import com.ibimina.client.BuildConfig
import com.ibimina.client.data.remote.dto.AllocationRequestDto
import com.ibimina.client.data.remote.dto.GroupDto
import com.ibimina.client.data.remote.dto.TapMomoPayloadDto
import com.ibimina.client.data.remote.dto.TapMomoPayloadExhaustionDto
import com.ibimina.client.data.remote.dto.TransactionDto
import com.ibimina.client.domain.model.NFCPayload
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.decodeList
import io.github.jan.supabase.realtime.Realtime
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseService @Inject constructor() {

    private val isoFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private val client = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Postgrest)
        install(Auth)
        install(Realtime)
    }

    suspend fun fetchUserGroups(userId: String): List<GroupDto> {
        return client.from("group_members")
            .select {
                filter {
                    eq("user_id", userId)
                }
            }
            .decodeList<GroupDto>()
    }

    suspend fun fetchTransactions(userId: String): List<TransactionDto> {
        return client.from("allocations")
            .select {
                filter {
                    eq("member_id", userId)
                }
                order("created_at", ascending = false)
            }
            .decodeList<TransactionDto>()
    }

    suspend fun createAllocation(request: AllocationRequestDto) {
        client.from("allocations").insert(request)
    }

    suspend fun registerNfcPayload(payload: NFCPayload) {
        val dto = TapMomoPayloadDto.fromDomain(payload)
        client.from("tapmomo_transactions").insert(dto)
    }

    suspend fun markPayloadExhausted(nonce: String) {
        val exhaustion = TapMomoPayloadExhaustionDto(
            exhaustedAt = isoFormatter.format(Date())
        )
        client.from("tapmomo_transactions")
            .update(exhaustion) {
                filter { eq("nonce", nonce) }
            }
    }
}
