package com.ibimina.client.data.auth

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.user.UserSession
import io.github.jan.supabase.exceptions.UnauthorizedRestException
import io.github.jan.supabase.functions
import io.ktor.client.request.header
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Handles Supabase GoTrue onboarding flows and session persistence.
 */
@Singleton
class AuthRepository @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val sessionManager: SupabaseSessionManager,
    private val ioDispatcher: CoroutineDispatcher
) {

    private val json = Json { ignoreUnknownKeys = true }

    val authState: Flow<AuthState> = sessionManager.sessionFlow
        .map { session ->
            session?.let {
                AuthState.Authenticated(
                    session = it,
                    memberId = it.memberId() ?: it.user?.id ?: ""
                )
            } ?: AuthState.SignedOut
        }
        .onStart { emit(AuthState.Loading) }

    val memberIdFlow: Flow<String> = authState
        .mapNotNull { state ->
            (state as? AuthState.Authenticated)?.memberId
        }

    suspend fun currentMemberId(): String? {
        val session = sessionManager.loadSession() ?: return null
        return session.memberId() ?: session.user?.id
    }

    suspend fun sendOtp(phoneNumber: String) = withContext(ioDispatcher) {
        val response = supabaseClient.functions.invoke("whatsapp-otp-send") {
            contentType(ContentType.Application.Json)
            setBody(json.encodeToString(SendOtpRequest.serializer(), SendOtpRequest(phoneNumber.normalizeMsisdn())))
        }
        val payload = json.decodeFromString(SendOtpResponse.serializer(), response.bodyAsText())
        if (!payload.success) {
            throw IllegalStateException(payload.message ?: "Unable to send verification code")
        }
    }

    suspend fun verifyOtp(phoneNumber: String, code: String, fullName: String? = null) = withContext(ioDispatcher) {
        val response = supabaseClient.functions.invoke("whatsapp-otp-verify") {
            header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            setBody(
                json.encodeToString(
                    VerifyOtpRequest.serializer(),
                    VerifyOtpRequest(
                        phoneNumber = phoneNumber.normalizeMsisdn(),
                        code = code.trim(),
                        fullName = fullName
                    )
                )
            )
        }
        val payload = json.decodeFromString(VerifyOtpResponse.serializer(), response.bodyAsText())
        if (!payload.success || payload.session == null) {
            throw IllegalStateException(payload.message ?: "Invalid verification code")
        }
        val session = json.decodeFromJsonElement(UserSession.serializer(), payload.session)
        supabaseClient.auth.importSession(session)
    }

    suspend fun refreshSession() {
        val session = sessionManager.loadSession() ?: return
        runCatching { supabaseClient.auth.refreshSession(session.refreshToken) }
            .onFailure { error ->
                if (error is UnauthorizedRestException) {
                    sessionManager.deleteSession()
                } else {
                    throw error
                }
            }
    }

    suspend fun signOut() {
        runCatching { supabaseClient.auth.signOut() }
        sessionManager.deleteSession()
    }

    private fun String.normalizeMsisdn(): String {
        val sanitized = replace(" ", "")
        return if (sanitized.startsWith("+")) sanitized else "+" + sanitized.trimStart('0')
    }

    private fun UserSession.memberId(): String? {
        return user?.userMetadata?.get("member_id")?.jsonPrimitive?.contentOrNull
    }
}

sealed interface AuthState {
    data object Loading : AuthState
    data object SignedOut : AuthState
    data class Authenticated(val session: UserSession, val memberId: String) : AuthState
}

@Serializable
private data class SendOtpRequest(
    @SerialName("phone_number") val phoneNumber: String
)

@Serializable
private data class SendOtpResponse(
    val success: Boolean,
    @SerialName("expires_at") val expiresAt: String? = null,
    val message: String? = null
)

@Serializable
private data class VerifyOtpRequest(
    @SerialName("phone_number") val phoneNumber: String,
    val code: String,
    @SerialName("full_name") val fullName: String? = null
)

@Serializable
private data class VerifyOtpResponse(
    val success: Boolean,
    val message: String? = null,
    val session: JsonObject? = null
)
