package com.ibimina.client.data

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.ibimina.client.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import timber.log.Timber
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Service responsible for interacting with the OpenAI chat completions API.
 */
@Singleton
class OpenAIService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson
) {

    private val apiKey: String = BuildConfig.OPENAI_API_KEY
    private val baseUrl: String = BuildConfig.OPENAI_BASE_URL.ifBlank { DEFAULT_OPENAI_BASE_URL }

    suspend fun sendMessage(messages: List<ChatMessage>): ChatMessage {
        if (apiKey.isBlank()) {
            return ChatMessage(
                role = ChatRole.ASSISTANT,
                content = "OpenAI API key is not configured."
            )
        }

        val requestBody = ChatCompletionRequest(
            model = DEFAULT_MODEL,
            messages = messages.map { ChatCompletionMessage(role = it.role.apiRole, content = it.content) }
        )

        val requestJson = gson.toJson(requestBody)
        val request = Request.Builder()
            .url("$baseUrl/v1/chat/completions")
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .post(requestJson.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        return withContext(Dispatchers.IO) {
            try {
                okHttpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        val reason = response.body?.string().orEmpty()
                        return@use ChatMessage(
                            role = ChatRole.ASSISTANT,
                            content = "Unable to reach assistant: ${response.code} $reason"
                        )
                    }

                    val body = response.body?.string().orEmpty()
                    val completionResponse = gson.fromJson(body, ChatCompletionResponse::class.java)
                    val message = completionResponse.choices.firstOrNull()?.message?.content
                    ChatMessage(role = ChatRole.ASSISTANT, content = message.orEmpty())
                }
            } catch (ioException: IOException) {
                Timber.w(ioException, "OpenAI request failed")
                ChatMessage(
                    role = ChatRole.ASSISTANT,
                    content = "Assistant is currently unavailable. Please try again later."
                )
            }
        }
    }

    private data class ChatCompletionRequest(
        val model: String,
        val messages: List<ChatCompletionMessage>
    )

    private data class ChatCompletionMessage(
        val role: String,
        val content: String
    )

    private data class ChatCompletionResponse(
        val choices: List<ChatCompletionChoice> = emptyList()
    )

    private data class ChatCompletionChoice(
        val message: ChoiceMessage? = null
    )

    private data class ChoiceMessage(
        val role: String? = null,
        val content: String? = null
    )

    companion object {
        private const val DEFAULT_MODEL = "gpt-3.5-turbo"
        private const val DEFAULT_OPENAI_BASE_URL = "https://api.openai.com"
        private val JSON_MEDIA_TYPE = "application/json".toMediaType()
    }
}

data class ChatMessage(
    val role: ChatRole,
    val content: String
)

enum class ChatRole(val apiRole: String) {
    @SerializedName("user")
    USER("user"),

    @SerializedName("assistant")
    ASSISTANT("assistant")
}
