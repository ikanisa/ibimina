package com.ibimina.client.security

import android.util.Base64
import com.ibimina.client.domain.model.NFCPayload
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import java.util.Locale
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

/**
 * PayloadSigner handles HMAC signature generation and validation for NFC payloads
 * 
 * Security features:
 * - HMAC-SHA256 for payload integrity
 * - Nonce generation for replay attack prevention
 * - TTL (time-to-live) for expiration
 */
object PayloadSigner {

    private const val HMAC_ALGORITHM = "HmacSHA256"
    private const val DEFAULT_TTL_SECONDS = 60L
    
    /**
     * Generate a cryptographically secure nonce
     */
    fun generateNonce(): String = UUID.randomUUID().toString()
    
    /**
     * Calculate HMAC signature for payload
     * 
     * @param payload The payload data to sign
     * @param secretKey The shared secret key
     * @return Base64-encoded signature
     */
    fun sign(payload: String, secretOverride: ByteArray? = null): String {
        try {
            val mac = Mac.getInstance(HMAC_ALGORITHM)
            mac.init(resolveSecret(secretOverride))
            val signatureBytes = mac.doFinal(payload.toByteArray(StandardCharsets.UTF_8))
            return Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            throw SecurityException("Failed to sign payload", e)
        }
    }
    
    /**
     * Verify HMAC signature
     * 
     * @param payload The payload data
     * @param signature The signature to verify
     * @param secretKey The shared secret key
     * @return true if signature is valid
     */
    fun verify(payload: String, signature: String, secretOverride: ByteArray? = null): Boolean {
        return try {
            val expectedSignature = sign(payload, secretOverride)
            // Use constant-time comparison to prevent timing attacks
            constantTimeEquals(signature, expectedSignature)
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Calculate expiration timestamp
     * 
     * @param ttlMs Time-to-live in milliseconds
     * @return Unix timestamp (milliseconds) when payload expires
     */
    fun calculateExpiry(ttlSeconds: Long = DEFAULT_TTL_SECONDS): Long {
        val issuedAt = System.currentTimeMillis() / 1000
        return issuedAt + ttlSeconds
    }
    
    /**
     * Check if timestamp is expired
     * 
     * @param expiresAt Unix timestamp (milliseconds)
     * @return true if expired
     */
    fun isExpired(expiresAt: Long): Boolean {
        return System.currentTimeMillis() > expiresAt
    }
    
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
    
    /**
     * Create a signed payload string for NFC transmission
     * 
     * Format: merchantId|network|amount|reference|timestamp|nonce|signature
     */
    fun createSignedPayload(
        merchantId: String,
        network: String,
        amount: Double,
        reference: String?,
        ttlSeconds: Long = DEFAULT_TTL_SECONDS,
        secretOverride: ByteArray? = null
    ): NFCPayload {
        val issuedAt = System.currentTimeMillis() / 1000
        val nonce = generateNonce()
        val payloadData = canonicalString(
            merchantId = merchantId,
            network = network,
            amount = amount,
            reference = reference,
            timestamp = issuedAt,
            nonce = nonce,
            ttlSeconds = ttlSeconds
        )
        val signature = sign(payloadData, secretOverride)
        return NFCPayload(
            amount = amount,
            network = network,
            merchantId = merchantId,
            reference = reference,
            hmacSignature = signature,
            nonce = nonce,
            timestamp = issuedAt,
            ttl = ttlSeconds
        )
    }
    
    /**
     * Validate a signed payload
     * 
     * Returns ValidationResult with details
     */
    fun validateSignedPayload(payload: NFCPayload, secretOverride: ByteArray? = null): ValidationResult {
        return try {
            if (payload.isExpired()) {
                return ValidationResult(false, "Payload expired")
            }
            val payloadData = canonicalString(
                merchantId = payload.merchantId,
                network = payload.network,
                amount = payload.amount,
                reference = payload.reference,
                timestamp = payload.timestamp,
                nonce = payload.nonce,
                ttlSeconds = payload.ttl
            )
            if (!verify(payloadData, payload.hmacSignature, secretOverride)) {
                return ValidationResult(false, "Invalid signature")
            }
            ValidationResult(true, "Valid")
        } catch (e: Exception) {
            ValidationResult(false, "Validation error: ${e.message}")
        }
    }

    private fun canonicalString(
        merchantId: String,
        network: String,
        amount: Double,
        reference: String?,
        timestamp: Long,
        nonce: String,
        ttlSeconds: Long
    ): String {
        return listOf(
            merchantId,
            network,
            String.format(Locale.US, "%.2f", amount),
            reference ?: "",
            timestamp.toString(),
            nonce,
            ttlSeconds.toString()
        ).joinToString("|")
    }

    private fun resolveSecret(secretOverride: ByteArray?): SecretKey {
        return if (secretOverride != null) {
            SecretKeySpec(secretOverride, HMAC_ALGORITHM)
        } else {
            NfcSecretManager.getSecretKey()
        }
    }
    
    data class ValidationResult(
        val valid: Boolean,
        val message: String
    )
}
