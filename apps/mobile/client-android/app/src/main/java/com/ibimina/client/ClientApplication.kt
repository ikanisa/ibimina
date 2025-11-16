package com.ibimina.client

import android.app.Application
import com.ibimina.client.security.NfcSecretManager
import dagger.hilt.android.HiltAndroidApp

/**
 * Application class for Ibimina Client App
 * 
 * Required for Hilt dependency injection
 */
@HiltAndroidApp
class ClientApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        runCatching { NfcSecretManager.ensureSecret() }
            .onFailure { throw IllegalStateException("Unable to provision NFC signing key", it) }
    }
}
