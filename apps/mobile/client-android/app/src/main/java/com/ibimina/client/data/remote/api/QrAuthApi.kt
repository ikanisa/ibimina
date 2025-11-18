package com.ibimina.client.data.remote.api

import com.google.gson.Gson
import com.ibimina.client.BuildConfig
import com.ibimina.client.data.remote.dto.QrExchangeRequest
import com.ibimina.client.data.remote.dto.QrExchangeResponse
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class QrAuthApi @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson,
) {
    private val apiBaseUrl: String = BuildConfig.API_BASE_URL.ifBlank { BuildConfig.SUPABASE_URL }
    private val exchangeUrl: String = apiBaseUrl.trimEnd('/') + "/api/qr-auth/exchange"

    suspend fun exchangeQrToken(token: String, accessToken: String, refreshToken: String): Boolean {
        if (apiBaseUrl.isBlank()) {
            throw IllegalStateException("API_BASE_URL is not configured")
        }

        return withContext(Dispatchers.IO) {
            val payload = QrExchangeRequest(
                token = token,
                accessToken = accessToken,
                refreshToken = refreshToken,
                deviceId = BuildConfig.APPLICATION_ID,
            )
            val requestBody = gson
                .toJson(payload)
                .toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(exchangeUrl)
                .post(requestBody)
                .build()

            okHttpClient.newCall(request).execute().use { response ->
                val body = response.body?.charStream()
                val result = body?.use { gson.fromJson(it, QrExchangeResponse::class.java) }

                if (!response.isSuccessful) {
                    throw IllegalStateException(result?.error ?: "QR exchange failed")
                }

                result?.success == true
            }
        }
    }
}
