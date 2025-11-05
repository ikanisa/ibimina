package com.ibimina.auth.api

import retrofit2.http.Body
import retrofit2.http.POST

private const val DEFAULT_BASE_URL = "https://api.example.com"

data class StartWhatsAppRequest(
    val whatsappNumber: String
)

data class StartWhatsAppResponse(
    val attemptId: String,
    val expiresIn: Int,
    val resendIn: Int? = null
)

data class VerifyWhatsAppRequest(
    val whatsappNumber: String,
    val code: String,
    val attemptId: String?
)

data class VerifyWhatsAppResponse(
    val token: String,
    val refreshToken: String? = null,
    val expiresIn: Int? = null
)

interface AuthService {
    @POST("/auth/whatsapp/start")
    suspend fun start(@Body body: StartWhatsAppRequest): StartWhatsAppResponse

    @POST("/auth/whatsapp/verify")
    suspend fun verify(@Body body: VerifyWhatsAppRequest): VerifyWhatsAppResponse
}

fun provideAuthService(baseUrl: String = DEFAULT_BASE_URL): AuthService {
    val moshi = com.squareup.moshi.Moshi.Builder().build()
    val retrofit = retrofit2.Retrofit.Builder()
        .baseUrl(baseUrl)
        .addConverterFactory(com.squareup.retrofit2.converter.moshi.MoshiConverterFactory.create(moshi))
        .client(
            okhttp3.OkHttpClient.Builder()
                .addInterceptor { chain ->
                    val request = chain.request().newBuilder()
                        .addHeader("Accept", "application/json")
                        .build()
                    chain.proceed(request)
                }
                .build()
        )
        .build()
    return retrofit.create(AuthService::class.java)
}
