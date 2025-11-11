package rw.gov.ikanisa.ibimina.client.auth

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * Biometric Authentication Helper
 * 
 * Wraps BiometricPrompt API for fingerprint/face authentication
 * Required to unlock device-bound private keys for signing
 */
class BiometricAuthHelper(private val activity: FragmentActivity) {
    
    /**
     * Check if biometric authentication is available
     */
    fun isBiometricAvailable(): BiometricStatus {
        val biometricManager = BiometricManager.from(activity)
        
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS ->
                BiometricStatus.Available
            
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
                BiometricStatus.NoHardware
            
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
                BiometricStatus.HardwareUnavailable
            
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
                BiometricStatus.NotEnrolled
            
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                BiometricStatus.SecurityUpdateRequired
            
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED ->
                BiometricStatus.Unsupported
            
            BiometricManager.BIOMETRIC_STATUS_UNKNOWN ->
                BiometricStatus.Unknown
            
            else -> BiometricStatus.Unknown
        }
    }
    
    /**
     * Authenticate user with biometrics
     * 
     * @param title Prompt title
     * @param subtitle Prompt subtitle (optional)
     * @param description Prompt description (optional)
     * @param negativeButtonText Cancel button text
     * @param onSuccess Callback when authentication succeeds
     * @param onError Callback when authentication fails
     */
    fun authenticate(
        title: String,
        subtitle: String? = null,
        description: String? = null,
        negativeButtonText: String = "Cancel",
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (Int, CharSequence) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        
        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess(result)
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errorCode, errString)
                }
                
                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    // User provided wrong biometric (but can retry)
                    // Don't call onError here - system will allow retry
                }
            }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .apply {
                subtitle?.let { setSubtitle(it) }
                description?.let { setDescription(it) }
            }
            .setNegativeButtonText(negativeButtonText)
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()
        
        biometricPrompt.authenticate(promptInfo)
    }
    
    /**
     * Authenticate with CryptoObject (for key-bound operations)
     * 
     * This is used when the private key requires biometric authentication.
     * The CryptoObject binds the authentication to the specific key operation.
     */
    fun authenticateWithCrypto(
        title: String,
        subtitle: String? = null,
        description: String? = null,
        negativeButtonText: String = "Cancel",
        cryptoObject: BiometricPrompt.CryptoObject,
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (Int, CharSequence) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        
        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess(result)
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errorCode, errString)
                }
            }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .apply {
                subtitle?.let { setSubtitle(it) }
                description?.let { setDescription(it) }
            }
            .setNegativeButtonText(negativeButtonText)
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()
        
        biometricPrompt.authenticate(promptInfo, cryptoObject)
    }
}

/**
 * Biometric availability status
 */
sealed class BiometricStatus {
    object Available : BiometricStatus()
    object NoHardware : BiometricStatus()
    object HardwareUnavailable : BiometricStatus()
    object NotEnrolled : BiometricStatus()
    object SecurityUpdateRequired : BiometricStatus()
    object Unsupported : BiometricStatus()
    object Unknown : BiometricStatus()
    
    fun isAvailable(): Boolean = this is Available
    
    fun getMessage(): String = when (this) {
        is Available -> "Biometric authentication is available"
        is NoHardware -> "No biometric hardware available"
        is HardwareUnavailable -> "Biometric hardware is currently unavailable"
        is NotEnrolled -> "No biometrics enrolled. Please set up fingerprint or face unlock in Settings"
        is SecurityUpdateRequired -> "Security update required"
        is Unsupported -> "Biometric authentication is not supported"
        is Unknown -> "Biometric status unknown"
    }
}
