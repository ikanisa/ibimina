package com.ibimina.client.data.remote.dto

data class QrExchangeRequest(
    val token: String,
    val accessToken: String,
    val refreshToken: String,
    val deviceId: String? = null,
    val fingerprint: String? = null,
)

data class QrExchangeResponse(
    val success: Boolean,
    val status: String? = null,
    val error: String? = null,
)
