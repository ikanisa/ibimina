package com.ibimina.client.security

import android.util.Base64
import java.security.SecureRandom
import javax.crypto.Mac
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
    private const val DEFAULT_TTL_MS = 60000L // 60 seconds
    
    /**
     * Generate a cryptographically secure nonce
     */
    fun generateNonce(): String {
        val random = SecureRandom()
        val bytes = ByteArray(16)
        random.nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
    
    /**
     * Calculate HMAC signature for payload
     * 
     * @param payload The payload data to sign
     * @param secretKey The shared secret key
     * @return Base64-encoded signature
     */
    fun sign(payload: String, secretKey: String): String {
        try {
            val mac = Mac.getInstance(HMAC_ALGORITHM)
            val secretKeySpec = SecretKeySpec(secretKey.toByteArray(), HMAC_ALGORITHM)
            mac.init(secretKeySpec)
            val signatureBytes = mac.doFinal(payload.toByteArray())
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
    fun verify(payload: String, signature: String, secretKey: String): Boolean {
        return try {
            val expectedSignature = sign(payload, secretKey)
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
    fun calculateExpiry(ttlMs: Long = DEFAULT_TTL_MS): Long {
        return System.currentTimeMillis() + ttlMs
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
        secretKey: String,
        ttlMs: Long = DEFAULT_TTL_MS
    ): Map<String, String> {
        val timestamp = System.currentTimeMillis()
        val expiresAt = calculateExpiry(ttlMs)
        val nonce = generateNonce()
        
        // Create payload string without signature
        val payloadData = "$merchantId|$network|$amount|${reference ?: ""}|$timestamp|$nonce|$expiresAt"
        
        // Sign the payload
        val signature = sign(payloadData, secretKey)
        
        return mapOf(
            "version" to "1.0",
            "merchantId" to merchantId,
            "network" to network,
            "amount" to amount.toString(),
            "reference" to (reference ?: ""),
            "timestamp" to timestamp.toString(),
            "nonce" to nonce,
            "expiresAt" to expiresAt.toString(),
            "signature" to signature
        )
    }
    
    /**
     * Validate a signed payload
     * 
     * Returns ValidationResult with details
     */
    fun validateSignedPayload(
        payloadMap: Map<String, String>,
        secretKey: String
    ): ValidationResult {
        try {
            val merchantId = payloadMap["merchantId"] ?: return ValidationResult(false, "Missing merchantId")
            val network = payloadMap["network"] ?: return ValidationResult(false, "Missing network")
            val amount = payloadMap["amount"] ?: return ValidationResult(false, "Missing amount")
            val reference = payloadMap["reference"] ?: ""
            val timestamp = payloadMap["timestamp"]?.toLongOrNull() ?: return ValidationResult(false, "Invalid timestamp")
            val nonce = payloadMap["nonce"] ?: return ValidationResult(false, "Missing nonce")
            val expiresAt = payloadMap["expiresAt"]?.toLongOrNull() ?: return ValidationResult(false, "Invalid expiresAt")
            val signature = payloadMap["signature"] ?: return ValidationResult(false, "Missing signature")
            
            // Check expiration
            if (isExpired(expiresAt)) {
                return ValidationResult(false, "Payload expired")
            }
            
            // Reconstruct payload for verification
            val payloadData = "$merchantId|$network|$amount|$reference|$timestamp|$nonce|$expiresAt"
            
            // Verify signature
            if (!verify(payloadData, signature, secretKey)) {
                return ValidationResult(false, "Invalid signature")
            }
            
            return ValidationResult(true, "Valid")
        } catch (e: Exception) {
            return ValidationResult(false, "Validation error: ${e.message}")
        }
    }
    
    data class ValidationResult(
        val valid: Boolean,
        val message: String
    )
}
