package rw.gov.ikanisa.ibimina.client.auth

import android.security.keystore.KeyPermanentlyInvalidatedException
import android.util.Base64
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import org.json.JSONObject
import java.security.InvalidKeyException

/**
 * Device Authentication Challenge Signer
 * 
 * Handles signing of authentication challenges with biometric-gated device keys
 */
class ChallengeSigner(
    private val activity: FragmentActivity,
    private val deviceId: String,
    private val userId: String
) {
    
    private val keyManager = DeviceKeyManager(deviceId)
    private val biometricHelper = BiometricAuthHelper(activity)
    
    /**
     * Sign a challenge from the web app
     * 
     * @param challenge Challenge object from QR code
     * @param onSuccess Called with signature and signed message
     * @param onError Called with error message
     */
    fun signChallenge(
        challenge: ChallengeData,
        onSuccess: (signature: String, signedMessage: SignedMessage) -> Unit,
        onError: (message: String) -> Unit
    ) {
        // Check if key exists
        if (!keyManager.hasKeyPair()) {
            onError("Device not enrolled. Please enroll this device first.")
            return
        }
        
        // Check biometric availability
        val biometricStatus = biometricHelper.isBiometricAvailable()
        if (!biometricStatus.isAvailable()) {
            onError("Biometric authentication not available: ${biometricStatus.getMessage()}")
            return
        }
        
        // Validate challenge
        if (!isValidChallenge(challenge)) {
            onError("Invalid challenge data")
            return
        }
        
        // Create signed message
        val signedMessage = SignedMessage(
            ver = 1,
            userId = userId,
            deviceId = deviceId,
            sessionId = challenge.sessionId,
            origin = challenge.origin,
            nonce = challenge.nonce,
            ts = System.currentTimeMillis() / 1000, // Unix timestamp in seconds
            scope = listOf("login"),
            alg = "ES256"
        )
        
        // Convert to canonical JSON (sorted keys)
        val messageJson = signedMessage.toCanonicalJson()
        val messageBytes = messageJson.toByteArray(Charsets.UTF_8)

        val initializedSignature = try {
            keyManager.getInitializedSignature()
        } catch (e: KeyPermanentlyInvalidatedException) {
            android.util.Log.w("ChallengeSigner", "Device key permanently invalidated", e)
            onError("Device security settings changed. Please re-enroll biometrics.")
            return
        } catch (e: InvalidKeyException) {
            android.util.Log.e("ChallengeSigner", "Failed to initialize device key", e)
            onError("Device key unavailable. Please re-enroll this device.")
            return
        } catch (e: Exception) {
            android.util.Log.e("ChallengeSigner", "Unexpected error initializing signature", e)
            onError("Failed to prepare biometric signing: ${e.message}")
            return
        }
            ?: run {
                onError("Device key unavailable. Please re-enroll this device.")
                return
            }

        val cryptoObject = BiometricPrompt.CryptoObject(initializedSignature)

        // Prompt for biometric authentication and sign
        biometricHelper.authenticateWithCrypto(
            title = "Confirm Sign In",
            subtitle = challenge.origin,
            description = "Authenticate to sign in to the web application",
            cryptoObject = cryptoObject,
            onSuccess = { result ->
                val signature = result.cryptoObject?.signature
                if (signature == null) {
                    android.util.Log.e("ChallengeSigner", "Biometric prompt returned null signature")
                    onError("Failed to access signature for signing")
                    return@authenticateWithCrypto
                }

                try {
                    signature.update(messageBytes)
                    val signedBytes = signature.sign()
                    val signatureBase64 = Base64.encodeToString(signedBytes, Base64.NO_WRAP)
                    onSuccess(signatureBase64, signedMessage)
                } catch (e: Exception) {
                    android.util.Log.e("ChallengeSigner", "Signing failed", e)
                    onError("Failed to sign challenge: ${e.message}")
                }
            },
            onError = { errorCode, errString ->
                android.util.Log.e("ChallengeSigner", "Biometric auth failed: $errorCode - $errString")
                onError("Authentication cancelled or failed")
            }
        )
    }
    
    /**
     * Validate challenge data
     */
    private fun isValidChallenge(challenge: ChallengeData): Boolean {
        // Check version
        if (challenge.ver != 1) {
            return false
        }
        
        // Check expiry
        val now = System.currentTimeMillis() / 1000
        if (challenge.exp <= now) {
            return false
        }
        
        // Check required fields
        if (challenge.sessionId.isBlank() || 
            challenge.origin.isBlank() || 
            challenge.nonce.isBlank()) {
            return false
        }
        
        // Validate origin format (basic check)
        if (!challenge.origin.startsWith("https://") && !challenge.origin.startsWith("http://localhost")) {
            return false
        }
        
        return true
    }
}

/**
 * Challenge data from QR code
 */
data class ChallengeData(
    val ver: Int,
    val sessionId: String,
    val origin: String,
    val nonce: String,
    val exp: Long, // Unix timestamp in seconds
    val aud: String
) {
    companion object {
        /**
         * Parse challenge from JSON string
         */
        fun fromJson(json: String): ChallengeData? {
            return try {
                val obj = JSONObject(json)
                ChallengeData(
                    ver = obj.getInt("ver"),
                    sessionId = obj.getString("session_id"),
                    origin = obj.getString("origin"),
                    nonce = obj.getString("nonce"),
                    exp = obj.getLong("exp"),
                    aud = obj.getString("aud")
                )
            } catch (e: Exception) {
                android.util.Log.e("ChallengeData", "Failed to parse challenge", e)
                null
            }
        }
    }
}

/**
 * Signed message sent to server
 */
data class SignedMessage(
    val ver: Int,
    val userId: String,
    val deviceId: String,
    val sessionId: String,
    val origin: String,
    val nonce: String,
    val ts: Long, // Unix timestamp in seconds
    val scope: List<String>,
    val alg: String
) {
    /**
     * Convert to canonical JSON with sorted keys
     * This ensures the same JSON string is used for signing and verification
     */
    fun toCanonicalJson(): String {
        val obj = JSONObject()
        obj.put("alg", alg)
        obj.put("device_id", deviceId)
        obj.put("nonce", nonce)
        obj.put("origin", origin)
        obj.put("scope", org.json.JSONArray(scope))
        obj.put("session_id", sessionId)
        obj.put("ts", ts)
        obj.put("user_id", userId)
        obj.put("ver", ver)
        return obj.toString()
    }
    
    /**
     * Convert to JSON for sending to server
     */
    fun toJson(): JSONObject {
        val obj = JSONObject()
        obj.put("ver", ver)
        obj.put("user_id", userId)
        obj.put("device_id", deviceId)
        obj.put("session_id", sessionId)
        obj.put("origin", origin)
        obj.put("nonce", nonce)
        obj.put("ts", ts)
        obj.put("scope", org.json.JSONArray(scope))
        obj.put("alg", alg)
        return obj
    }
}
