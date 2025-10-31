package com.tapmomo.feature.nfc

import com.tapmomo.feature.Network
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.core.CryptoUtils
import com.tapmomo.feature.core.TimeUtils
import com.tapmomo.feature.data.models.PaymentPayload
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

/**
 * Builder for creating payment payloads
 */
object PayloadBuilder {
    
    /**
     * Create a signed payment payload
     */
    fun createPayload(
        network: Network,
        merchantId: String,
        amount: Int? = null,
        ref: String? = null,
        merchantSecret: String? = null
    ): PaymentPayload {
        val config = TapMoMo.getConfig()
        val timestamp = TimeUtils.nowMillis()
        val nonce = UUID.randomUUID().toString()
        
        // Create signature if secret is provided
        val signature = if (merchantSecret != null && config.requireSignature) {
            val message = CryptoUtils.createSignableMessage(
                ver = 1,
                network = network.name,
                merchantId = merchantId,
                currency = config.defaultCurrency,
                amount = amount,
                ref = ref,
                ts = timestamp,
                nonce = nonce
            )
            CryptoUtils.hmacSha256(message, merchantSecret)
        } else {
            null
        }
        
        return PaymentPayload(
            ver = 1,
            network = network.name,
            merchantId = merchantId,
            currency = config.defaultCurrency,
            amount = amount,
            ref = ref,
            ts = timestamp,
            nonce = nonce,
            sig = signature
        )
    }
    
    /**
     * Serialize payload to JSON
     */
    fun toJson(payload: PaymentPayload): String {
        return Json.encodeToString(payload)
    }
    
    /**
     * Deserialize payload from JSON
     */
    fun fromJson(json: String): PaymentPayload? {
        return try {
            Json.decodeFromString<PaymentPayload>(json)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
