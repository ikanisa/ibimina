package com.tapmomo.feature.core

import android.util.Base64
import java.nio.charset.StandardCharsets
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Cryptographic utilities for payload signing and verification
 */
object CryptoUtils {
    
    private const val HMAC_ALGORITHM = "HmacSHA256"
    
    /**
     * Generate HMAC-SHA256 signature for a message
     */
    fun hmacSha256(message: String, secret: String): String {
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val secretKeySpec = SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), HMAC_ALGORITHM)
        mac.init(secretKeySpec)
        val bytes = mac.doFinal(message.toByteArray(StandardCharsets.UTF_8))
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
    
    /**
     * Verify HMAC-SHA256 signature
     */
    fun verifyHmacSha256(message: String, signature: String, secret: String): Boolean {
        val expectedSignature = hmacSha256(message, secret)
        return constantTimeEquals(expectedSignature, signature)
    }
    
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) {
            return false
        }
        
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
    
    /**
     * Create message for signing (payload without signature field)
     */
    fun createSignableMessage(
        ver: Int,
        network: String,
        merchantId: String,
        currency: String,
        amount: Int?,
        ref: String?,
        ts: Long,
        nonce: String
    ): String {
        return buildString {
            append("ver=$ver")
            append("&network=$network")
            append("&merchantId=$merchantId")
            append("&currency=$currency")
            if (amount != null) append("&amount=$amount")
            if (ref != null) append("&ref=$ref")
            append("&ts=$ts")
            append("&nonce=$nonce")
        }
    }
}
