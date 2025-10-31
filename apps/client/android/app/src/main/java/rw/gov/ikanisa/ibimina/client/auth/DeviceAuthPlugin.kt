package rw.gov.ikanisa.ibimina.client.auth

import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject

/**
 * Capacitor Plugin for Device Authentication
 * 
 * Exposes device-bound authentication methods to the web layer
 */
@CapacitorPlugin(name = "DeviceAuth")
class DeviceAuthPlugin : Plugin() {
    
    private lateinit var deviceId: String
    
    override fun load() {
        super.load()
        
        // Get unique device ID (Android ID)
        deviceId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )
    }
    
    /**
     * Check if device has a keypair enrolled
     */
    @PluginMethod
    fun hasKeyPair(call: PluginCall) {
        try {
            val keyManager = DeviceKeyManager(deviceId)
            val hasKey = keyManager.hasKeyPair()
            
            val ret = JSObject()
            ret.put("hasKeyPair", hasKey)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to check keypair", e)
        }
    }
    
    /**
     * Generate a new keypair
     */
    @PluginMethod
    fun generateKeyPair(call: PluginCall) {
        try {
            val requireBiometric = call.getBoolean("requireBiometric", true) ?: true
            val requireStrongBox = call.getBoolean("requireStrongBox", true) ?: true
            
            val keyManager = DeviceKeyManager(deviceId)
            keyManager.generateKeyPair(requireBiometric, requireStrongBox)
            
            val publicKeyPem = keyManager.getPublicKeyPem()
            
            val ret = JSObject()
            ret.put("success", true)
            ret.put("publicKey", publicKeyPem)
            ret.put("algorithm", "ES256")
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to generate keypair", e)
        }
    }
    
    /**
     * Get public key in PEM format
     */
    @PluginMethod
    fun getPublicKey(call: PluginCall) {
        try {
            val keyManager = DeviceKeyManager(deviceId)
            val publicKeyPem = keyManager.getPublicKeyPem()
            
            if (publicKeyPem == null) {
                call.reject("No keypair found")
                return
            }
            
            val ret = JSObject()
            ret.put("publicKey", publicKeyPem)
            ret.put("algorithm", "ES256")
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get public key", e)
        }
    }
    
    /**
     * Get device ID
     */
    @PluginMethod
    fun getDeviceId(call: PluginCall) {
        val ret = JSObject()
        ret.put("deviceId", deviceId)
        call.resolve(ret)
    }
    
    /**
     * Get device info
     */
    @PluginMethod
    fun getDeviceInfo(call: PluginCall) {
        val ret = JSObject()
        ret.put("deviceId", deviceId)
        ret.put("model", android.os.Build.MODEL)
        ret.put("manufacturer", android.os.Build.MANUFACTURER)
        ret.put("osVersion", android.os.Build.VERSION.RELEASE)
        ret.put("sdkVersion", android.os.Build.VERSION.SDK_INT)
        call.resolve(ret)
    }
    
    /**
     * Check biometric availability
     */
    @PluginMethod
    fun checkBiometricAvailable(call: PluginCall) {
        try {
            val activity = activity ?: run {
                call.reject("Activity not available")
                return
            }
            
            val biometricHelper = BiometricAuthHelper(activity)
            val status = biometricHelper.isBiometricAvailable()
            
            val ret = JSObject()
            ret.put("available", status.isAvailable())
            ret.put("message", status.getMessage())
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to check biometric availability", e)
        }
    }
    
    /**
     * Sign a challenge
     * 
     * Requires: challengeJson (JSON string)
     * Returns: signature (base64), signedMessage (JSON object)
     */
    @PluginMethod
    fun signChallenge(call: PluginCall) {
        try {
            val activity = activity ?: run {
                call.reject("Activity not available")
                return
            }
            
            val challengeJson = call.getString("challengeJson") ?: run {
                call.reject("Missing challengeJson parameter")
                return
            }
            
            val userId = call.getString("userId") ?: run {
                call.reject("Missing userId parameter")
                return
            }
            
            // Parse challenge
            val challenge = ChallengeData.fromJson(challengeJson) ?: run {
                call.reject("Invalid challenge JSON")
                return
            }
            
            // Create signer
            val signer = ChallengeSigner(activity, deviceId, userId)
            
            // Sign challenge with biometric prompt
            signer.signChallenge(
                challenge = challenge,
                onSuccess = { signature, signedMessage ->
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("signature", signature)
                    ret.put("signedMessage", JSObject(signedMessage.toJson().toString()))
                    call.resolve(ret)
                },
                onError = { errorMessage ->
                    call.reject(errorMessage)
                }
            )
        } catch (e: Exception) {
            call.reject("Failed to sign challenge", e)
        }
    }
    
    /**
     * Delete keypair
     */
    @PluginMethod
    fun deleteKeyPair(call: PluginCall) {
        try {
            val keyManager = DeviceKeyManager(deviceId)
            keyManager.deleteKeyPair()
            
            val ret = JSObject()
            ret.put("success", true)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to delete keypair", e)
        }
    }
}
