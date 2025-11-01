package com.ibimina.tapmomo.proto

import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

/**
 * Cryptographic helpers shared across Android and iOS.
 */
object TapMoMoSigner {
    /**
     * Construct the canonical string used for signing TapMoMo payloads.
     */
    fun createSignableMessage(payload: TapMoMoPayload): String {
        return buildString {
            append("ver=").append(payload.ver)
            append("&network=").append(payload.network)
            append("&merchantId=").append(payload.merchantId)
            append("&currency=").append(payload.currency)
            payload.amount?.let { append("&amount=").append(it) }
            payload.ref?.let { append("&ref=").append(it) }
            append("&ts=").append(payload.ts)
            append("&nonce=").append(payload.nonce)
        }
    }

    /**
     * Create a base64 encoded HMAC-SHA256 signature for the supplied payload.
     */
    @OptIn(ExperimentalEncodingApi::class)
    fun sign(payload: TapMoMoPayload, secret: String): String {
        val message = createSignableMessage(payload)
        val signature = platformHmacSha256(message.encodeToByteArray(), secret.encodeToByteArray())
        return Base64.encode(signature)
    }

    /**
     * Sign an arbitrary message using HMAC-SHA256 and base64 encoding.
     */
    @OptIn(ExperimentalEncodingApi::class)
    fun signMessage(message: String, secret: String): String {
        val signature = platformHmacSha256(message.encodeToByteArray(), secret.encodeToByteArray())
        return Base64.encode(signature)
    }

    /**
     * Attach a signature to a payload and return the updated model.
     */
    fun attachSignature(payload: TapMoMoPayload, secret: String): TapMoMoPayload {
        val signature = sign(payload, secret)
        return payload.copy(signature = signature)
    }

    /**
     * Verify that a payload signature was created using the supplied secret.
     */
    fun verify(payload: TapMoMoPayload, secret: String): Boolean {
        val signature = payload.signature ?: return false
        val expected = sign(payload.copy(signature = null), secret)
        return constantTimeEquals(signature, expected)
    }

    /**
     * Constant-time string comparison to avoid timing attacks.
     */
    fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
}

expect fun platformHmacSha256(message: ByteArray, secret: ByteArray): ByteArray
