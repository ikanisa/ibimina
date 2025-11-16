package com.ibimina.client.security

import android.security.keystore.KeyProperties
import android.security.keystore.KeyProtection
import android.util.Base64
import com.ibimina.client.BuildConfig
import java.security.KeyStore
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

/**
 * Handles provisioning and retrieval of the HMAC secret stored inside the
 * Android Keystore.
 */
object NfcSecretManager {

    private const val KEY_ALIAS = "ibimina.tapmomo.hmac"
    private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private val keyStore: KeyStore by lazy {
        KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
    }

    /**
     * Ensure the signing secret exists. When running in development we seed the
     * keystore with the value provided through [BuildConfig.NFC_HMAC_SECRET].
     */
    @Synchronized
    fun ensureSecret() {
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return
        }
        val encoded = BuildConfig.NFC_HMAC_SECRET
        require(encoded.isNotBlank()) {
            "Missing NFC_HMAC_SECRET. Provide one through local.properties or env vars."
        }
        val seed = Base64.decode(encoded, Base64.DEFAULT)
        importSecret(seed)
    }

    /**
     * Import a server-issued secret.
     */
    @Synchronized
    fun importSecret(secret: ByteArray) {
        val protection = KeyProtection.Builder(
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setUserAuthenticationRequired(false)
            .build()
        val entry = KeyStore.SecretKeyEntry(SecretKeySpec(secret, KeyProperties.KEY_ALGORITHM_HMAC_SHA256))
        keyStore.setEntry(KEY_ALIAS, entry, protection)
    }

    /**
     * Returns the provisioned secret key for signing and verification.
     */
    @Synchronized
    fun getSecretKey(): SecretKey {
        ensureSecret()
        val key = keyStore.getKey(KEY_ALIAS, null)
        requireNotNull(key) { "NFC signing key is unavailable" }
        return key as SecretKey
    }
}
