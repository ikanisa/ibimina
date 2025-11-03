package com.ibimina.auth

import android.app.Application
import com.ibimina.auth.api.provideAuthService
import com.ibimina.auth.data.AuthRepository
import com.ibimina.auth.util.TokenStore

class AuthApplication : Application() {
    lateinit var repository: AuthRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val service = provideAuthService()
        val tokenStore = TokenStore(this)
        repository = AuthRepository(service, tokenStore)
    }
}
