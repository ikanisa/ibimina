package rw.gov.ikanisa.ibimina.client.auth

import android.util.Base64
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import org.json.JSONObject
import rw.gov.ikanisa.ibimina.client.nfc.ActivePayload

class PaymentPayloadSigner(
    private val activity: FragmentActivity,
    private val deviceId: String,
    private val userId: String
) {
    private val keyManager = DeviceKeyManager(deviceId)
    private val biometricHelper = BiometricAuthHelper(activity)

    fun sign(
        payload: PaymentPayload,
        onSuccess: (ActivePayload) -> Unit,
        onError: (String) -> Unit
    ) {
        if (!keyManager.hasKeyPair()) {
            onError("Device not enrolled. Please complete Phase 1 enrollment first.")
            return
        }

        val biometricStatus = biometricHelper.isBiometricAvailable()
        if (!biometricStatus.isAvailable()) {
            onError("Biometric authentication unavailable: ${biometricStatus.getMessage()}")
            return
        }

        val validationError = payload.validate()
        if (validationError != null) {
            onError(validationError)
            return
        }

        val canonicalJson = payload.toCanonicalJson(userId = userId, deviceId = deviceId)
        val messageBytes = canonicalJson.toByteArray(Charsets.UTF_8)

        val initializedSignature = keyManager.getInitializedSignature()
        if (initializedSignature == null) {
            onError("Device key is unavailable. Re-enroll to continue.")
            return
        }

        val cryptoObject = BiometricPrompt.CryptoObject(initializedSignature)
        biometricHelper.authenticateWithCrypto(
            title = "Authorize payout",
            subtitle = payload.merchantName,
            description = "Confirm to arm the NFC card with payment credentials",
            cryptoObject = cryptoObject,
            onSuccess = { result ->
                val signature = result.cryptoObject?.signature
                if (signature == null) {
                    onError("Failed to sign payload: missing signature reference")
                    return@authenticateWithCrypto
                }

                try {
                    signature.update(messageBytes)
                    val signed = signature.sign()
                    val signatureBase64 = Base64.encodeToString(signed, Base64.NO_WRAP)
                    onSuccess(
                        ActivePayload(
                            payloadJson = canonicalJson,
                            signatureBase64 = signatureBase64,
                            merchantAccount = payload.merchantAccount,
                            merchantName = payload.merchantName,
                            amountMinor = payload.amountMinor,
                            currency = payload.currency,
                            note = payload.note,
                            nonce = payload.nonce,
                            issuedAtMillis = payload.issuedAtMillis,
                            expiresAtMillis = payload.expiresAtMillis
                        )
                    )
                } catch (t: Throwable) {
                    onError("Failed to sign payload: ${t.message}")
                }
            },
            onError = { _, errString ->
                onError(errString.toString())
            }
        )
    }
}

data class PaymentPayload(
    val merchantAccount: String,
    val merchantName: String,
    val amountMinor: Long,
    val currency: String,
    val note: String?,
    val nonce: String,
    val issuedAtMillis: Long,
    val expiresAtMillis: Long
) {
    fun validate(): String? {
        if (merchantAccount.isBlank()) return "Merchant account is required"
        if (merchantName.isBlank()) return "Merchant name is required"
        if (amountMinor <= 0) return "Amount must be greater than zero"
        if (currency.isBlank()) return "Currency is required"
        if (nonce.isBlank()) return "Nonce must not be blank"
        if (expiresAtMillis <= issuedAtMillis) return "Expiry must be in the future"
        return null
    }

    fun toCanonicalJson(userId: String, deviceId: String): String {
        val envelope = JSONObject()
        envelope.put("ver", 1)
        envelope.put("user_id", userId)
        envelope.put("device_id", deviceId)
        envelope.put("merchant_account", merchantAccount)
        envelope.put("merchant_name", merchantName)
        envelope.put("amount_minor", amountMinor)
        envelope.put("currency", currency)
        envelope.put("note", note ?: JSONObject.NULL)
        envelope.put("nonce", nonce)
        envelope.put("iat", issuedAtMillis / 1000)
        envelope.put("exp", expiresAtMillis / 1000)
        return envelope.toString()
    }
}
