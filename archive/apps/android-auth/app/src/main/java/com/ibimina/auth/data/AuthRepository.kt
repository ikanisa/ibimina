package com.ibimina.auth.data

import com.ibimina.auth.api.AuthService
import com.ibimina.auth.api.StartWhatsAppRequest
import com.ibimina.auth.api.StartWhatsAppResponse
import com.ibimina.auth.api.VerifyWhatsAppRequest
import com.ibimina.auth.api.VerifyWhatsAppResponse
import com.ibimina.auth.util.TokenStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val service: AuthService,
    private val tokenStore: TokenStorage
) {
    suspend fun startAuth(whatsappNumber: String): StartWhatsAppResponse = withContext(Dispatchers.IO) {
        service.start(StartWhatsAppRequest(whatsappNumber))
    }

    suspend fun verifyCode(
        whatsappNumber: String,
        code: String,
        attemptId: String?
    ): VerifyWhatsAppResponse = withContext(Dispatchers.IO) {
        val response = service.verify(VerifyWhatsAppRequest(whatsappNumber, code, attemptId))
        tokenStore.saveToken(response.token)
        response
    }

    suspend fun loadToken(): String? = tokenStore.getToken()
}
