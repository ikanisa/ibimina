package com.tapmomo.feature.data.models

import kotlinx.serialization.Serializable

/**
 * NFC payment payload sent from payee (merchant) to payer
 */
@Serializable
data class PaymentPayload(
    val ver: Int = 1,
    val network: String,
    val merchantId: String,
    val currency: String,
    val amount: Int? = null,
    val ref: String? = null,
    val ts: Long,
    val nonce: String,
    val sig: String? = null
)

/**
 * Payment request data (before signing)
 */
data class PaymentRequest(
    val network: String,
    val merchantId: String,
    val currency: String,
    val amount: Int? = null,
    val ref: String? = null
)

/**
 * Payment confirmation result
 */
data class PaymentResult(
    val success: Boolean,
    val transactionId: String? = null,
    val errorMessage: String? = null
)

/**
 * SIM card information for dual-SIM devices
 */
data class SimInfo(
    val subscriptionId: Int,
    val displayName: String,
    val carrierName: String,
    val slotIndex: Int
)
