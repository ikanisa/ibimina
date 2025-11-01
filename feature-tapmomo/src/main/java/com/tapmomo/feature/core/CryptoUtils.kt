package com.tapmomo.feature.core

import com.ibimina.tapmomo.proto.TapMoMoPayload
import com.ibimina.tapmomo.proto.TapMoMoSigner

/**
 * Cryptographic utilities for payload signing and verification
 */
object CryptoUtils {

    /**
     * Generate HMAC-SHA256 signature for a message
     */
    fun hmacSha256(message: String, secret: String): String {
        return TapMoMoSigner.signMessage(message, secret)
    }

    /**
     * Verify HMAC-SHA256 signature
     */
    fun verifyHmacSha256(message: String, signature: String, secret: String): Boolean {
        val expectedSignature = TapMoMoSigner.signMessage(message, secret)
        return TapMoMoSigner.constantTimeEquals(expectedSignature, signature)
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
        val payload = TapMoMoPayload(
            ver = ver,
            network = network,
            merchantId = merchantId,
            currency = currency,
            amount = amount,
            ref = ref,
            ts = ts,
            nonce = nonce
        )
        return TapMoMoSigner.createSignableMessage(payload)
    }
}
