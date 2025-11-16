package com.ibimina.staff.service

import com.ibimina.staff.BuildConfig
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.POST

@Singleton
class OpenAIService @Inject constructor(
    private val retrofit: Retrofit,
    private val supabaseClient: SupabaseClient
) {
    private val api: OpenAIApi by lazy { retrofit.create(OpenAIApi::class.java) }

    fun readiness(): Flow<OpenAIReadiness> = flow {
        val missing = mutableListOf<String>()
        if (BuildConfig.OPENAI_API_KEY.isBlank()) {
            missing += "OpenAI API key"
        }
        if (!supabaseClient.isConfigured()) {
            missing += "Supabase"
        }
        if (missing.isEmpty()) {
            emit(OpenAIReadiness(isReady = true, message = "OpenAI assistant ready"))
        } else {
            emit(OpenAIReadiness(isReady = false, message = "Missing configuration: ${missing.joinToString()}"))
        }
    }

    suspend fun sendPrompt(prompt: String): Result<String> {
        if (prompt.isBlank()) {
            return Result.failure(IllegalArgumentException("Prompt cannot be empty"))
        }
        if (BuildConfig.OPENAI_API_KEY.isBlank()) {
            return Result.failure(IllegalStateException("OpenAI API key is not configured"))
        }

        return runCatching {
            val request = mapOf(
                "model" to "gpt-4o-mini",
                "messages" to listOf(mapOf("role" to "user", "content" to prompt)),
                "max_tokens" to 256
            )
            val response = api.createChatCompletion(request)
            if (response.isSuccessful) {
                response.body()?.string()?.takeIf { it.isNotBlank() }
                    ?: "OpenAI returned an empty response"
            } else {
                val details = response.errorBody()?.string()?.takeIf { it.isNotBlank() }
                throw IllegalStateException(
                    "OpenAI call failed: ${response.code()} ${details.orEmpty()}".trim()
                )
            }
        }
    }

    interface OpenAIApi {
        @POST("v1/chat/completions")
        suspend fun createChatCompletion(@Body request: Map<String, Any>): Response<ResponseBody>
    }
}

data class OpenAIReadiness(val isReady: Boolean, val message: String)
