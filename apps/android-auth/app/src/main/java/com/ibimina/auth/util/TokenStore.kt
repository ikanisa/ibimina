package com.ibimina.auth.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private const val PREF_NAME = "ibimina_auth"
private const val TOKEN_KEY = "jwt_token"

interface TokenStorage {
    suspend fun saveToken(token: String)
    suspend fun clearToken()
    suspend fun getToken(): String?
}

class TokenStore(context: Context) : TokenStorage {
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREF_NAME,
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    override suspend fun saveToken(token: String) = withContext(Dispatchers.IO) {
        sharedPreferences.edit().putString(TOKEN_KEY, token).apply()
    }

    override suspend fun clearToken() = withContext(Dispatchers.IO) {
        sharedPreferences.edit().remove(TOKEN_KEY).apply()
    }

    override suspend fun getToken(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(TOKEN_KEY, null)
    }
}
