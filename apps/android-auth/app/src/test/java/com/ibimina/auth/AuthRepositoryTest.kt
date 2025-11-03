package com.ibimina.auth

import com.ibimina.auth.api.AuthService
import com.ibimina.auth.api.StartWhatsAppRequest
import com.ibimina.auth.api.StartWhatsAppResponse
import com.ibimina.auth.api.VerifyWhatsAppRequest
import com.ibimina.auth.api.VerifyWhatsAppResponse
import com.ibimina.auth.data.AuthRepository
import com.ibimina.auth.util.TokenStorage
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

private class FakeTokenStorage : TokenStorage {
    var storedToken: String? = null

    override suspend fun saveToken(token: String) {
        storedToken = token
    }

    override suspend fun clearToken() {
        storedToken = null
    }

    override suspend fun getToken(): String? = storedToken
}

private class FakeAuthService : AuthService {
    var startResponses = mutableListOf<StartWhatsAppResponse>()
    var verifyResponses = mutableListOf<VerifyWhatsAppResponse>()

    override suspend fun start(body: StartWhatsAppRequest): StartWhatsAppResponse {
        return startResponses.removeFirst()
    }

    override suspend fun verify(body: VerifyWhatsAppRequest): VerifyWhatsAppResponse {
        return verifyResponses.removeFirst()
    }
}

class AuthRepositoryTest {
    @Test
    fun verifyCodePersistsToken() = runTest {
        val tokenStorage = FakeTokenStorage()
        val service = FakeAuthService().apply {
            verifyResponses.add(VerifyWhatsAppResponse(token = "token123", refreshToken = null, expiresIn = 3600))
        }
        val repository = AuthRepository(service, tokenStorage)

        val response = repository.verifyCode("2507", "123456", "attempt")

        assertEquals("token123", response.token)
        assertEquals("token123", tokenStorage.storedToken)
    }

    @Test
    fun loadTokenReturnsNullWhenMissing() = runTest {
        val tokenStorage = FakeTokenStorage()
        val repository = AuthRepository(FakeAuthService(), tokenStorage)

        assertNull(repository.loadToken())
    }
}
