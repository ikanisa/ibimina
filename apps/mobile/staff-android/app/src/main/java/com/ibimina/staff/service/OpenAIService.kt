package com.ibimina.staff.service

import com.ibimina.staff.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.POST
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OpenAIService @Inject constructor(
    private val retrofit: Retrofit,
    private val supabaseClient: SupabaseClient
) {
    private val api: OpenAIApi by lazy { retrofit.create(OpenAIApi::class.java) }

    fun readiness(): Flow<Result<Boolean>> = flow {
        val isSupabaseConfigured = supabaseClient.isConfigured()
        emit(Result.success(isSupabaseConfigured && BuildConfig.OPENAI_API_KEY.isNotEmpty()))
    }

    suspend fun sendPrompt(prompt: String): Result<String> {
        if (BuildConfig.OPENAI_API_KEY.isBlank()) {
            return Result.failure(IllegalStateException("OpenAI API key is not configured"))
        }

        return runCatching {
            val request = mapOf(
                "model" to "gpt-4o-mini",
                "messages" to listOf(mapOf("role" to "user", "content" to prompt)),
                "max_tokens" to 16
            )
            val response = api.createChatCompletion(request)
            if (response.isSuccessful) {
                "Response received from OpenAI placeholder"
            } else {
                throw IllegalStateException("OpenAI call failed: ${'$'}{response.code()}")
            }
        }
    }

    interface OpenAIApi {
        @POST("v1/chat/completions")
        suspend fun createChatCompletion(@Body request: Map<String, Any>): Response<ResponseBody>
    }
}
