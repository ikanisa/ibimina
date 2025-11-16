package com.ibimina.client.data.repository

import com.ibimina.client.data.remote.SupabaseService
import com.ibimina.client.domain.model.NFCPayload
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NfcPayloadRepository @Inject constructor(
    private val supabaseService: SupabaseService
) {
    suspend fun persist(payload: NFCPayload) {
        supabaseService.registerNfcPayload(payload)
    }

    suspend fun markExhausted(payload: NFCPayload) {
        supabaseService.markPayloadExhausted(payload.nonce)
    }
}
