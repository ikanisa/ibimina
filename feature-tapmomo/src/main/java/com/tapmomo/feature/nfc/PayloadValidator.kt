package com.tapmomo.feature.nfc

import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.core.CryptoUtils
import com.tapmomo.feature.core.TimeUtils
import com.tapmomo.feature.data.TapMoMoRepository
import com.tapmomo.feature.data.models.PaymentPayload

/**
 * Result of payload validation
 */
sealed class ValidationResult {
    object Valid : ValidationResult()
    data class Invalid(val reason: String) : ValidationResult()
    data class UnsignedWarning(val payload: PaymentPayload) : ValidationResult()
}

/**
 * Validates payment payloads for security
 */
class PayloadValidator(private val repository: TapMoMoRepository) {
    
    /**
     * Validate a payment payload
     */
    suspend fun validate(payload: PaymentPayload, merchantSecret: String? = null): ValidationResult {
        val config = TapMoMo.getConfig()
        
        // 1. Check TTL
        if (!TimeUtils.validatePayloadTtl(payload, 120_000)) {
            return ValidationResult.Invalid("Payment request has expired")
        }
        
        // 2. Check nonce replay
        if (repository.hasSeenNonce(payload.nonce)) {
            return ValidationResult.Invalid("Duplicate payment request detected")
        }
        
        // 3. Check signature if required
        if (config.requireSignature) {
            if (payload.sig == null) {
                return if (config.allowUnsignedWithWarning) {
                    ValidationResult.UnsignedWarning(payload)
                } else {
                    ValidationResult.Invalid("Payment signature is required")
                }
            }
            
            // Verify signature if we have the merchant secret
            if (merchantSecret != null) {
                val message = CryptoUtils.createSignableMessage(
                    ver = payload.ver,
                    network = payload.network,
                    merchantId = payload.merchantId,
                    currency = payload.currency,
                    amount = payload.amount,
                    ref = payload.ref,
                    ts = payload.ts,
                    nonce = payload.nonce
                )
                
                if (!CryptoUtils.verifyHmacSha256(message, payload.sig, merchantSecret)) {
                    return ValidationResult.Invalid("Invalid payment signature")
                }
            }
        }
        
        // Mark nonce as seen to prevent replay
        repository.markNonceSeen(payload.nonce)
        
        return ValidationResult.Valid
    }
}
