package rw.gov.ikanisa.ibimina.client.auth

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.*
import java.security.spec.ECGenParameterSpec
import java.security.spec.X509EncodedKeySpec

/**
 * Device Key Manager
 * 
 * Manages EC P-256 keypairs in Android Keystore with biometric binding.
 * Keys are bound to StrongBox if available for hardware-backed security.
 */
class DeviceKeyManager(private val deviceId: String) {
    
    companion object {
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALGORITHM = KeyProperties.KEY_ALGORITHM_EC
        private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"
        private const val EC_CURVE = "secp256r1" // P-256
        
        // Key alias in Android Keystore
        private fun getKeyAlias(deviceId: String) = "device_auth_key_$deviceId"
    }
    
    /**
     * Generate a new EC P-256 keypair in Android Keystore
     * 
     * @param requireBiometric If true, key can only be used after biometric authentication
     * @param requireStrongBox If true, prefer StrongBox-backed key (hardware security module)
     * @return KeyPair generated
     */
    fun generateKeyPair(
        requireBiometric: Boolean = true,
        requireStrongBox: Boolean = true
    ): KeyPair {
        val keyAlias = getKeyAlias(deviceId)
        
        // Delete existing key if any
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
        keyStore.load(null)
        if (keyStore.containsAlias(keyAlias)) {
            keyStore.deleteEntry(keyAlias)
        }
        
        // Build KeyGenParameterSpec
        val builder = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setAlgorithmParameterSpec(ECGenParameterSpec(EC_CURVE))
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setUserAuthenticationRequired(requireBiometric)
        
        // Set biometric timeout to 0 (requires auth for every use)
        if (requireBiometric) {
            builder.setUserAuthenticationParameters(
                0, // timeout in seconds (0 = every use)
                KeyProperties.AUTH_BIOMETRIC_STRONG
            )
        }
        
        // Try to use StrongBox if available
        if (requireStrongBox) {
            try {
                builder.setIsStrongBoxBacked(true)
            } catch (e: Exception) {
                // StrongBox not available, will use TEE instead
                android.util.Log.w("DeviceKeyManager", "StrongBox not available, using TEE", e)
            }
        }
        
        val spec = builder.build()
        
        // Generate keypair
        val keyPairGenerator = KeyPairGenerator.getInstance(
            KEY_ALGORITHM,
            KEYSTORE_PROVIDER
        )
        keyPairGenerator.initialize(spec)
        
        return keyPairGenerator.generateKeyPair()
    }
    
    /**
     * Get existing keypair from Keystore
     * 
     * @return KeyPair or null if not found
     */
    fun getKeyPair(): KeyPair? {
        val keyAlias = getKeyAlias(deviceId)
        
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
        keyStore.load(null)
        
        if (!keyStore.containsAlias(keyAlias)) {
            return null
        }
        
        val privateKey = keyStore.getKey(keyAlias, null) as PrivateKey
        val publicKey = keyStore.getCertificate(keyAlias)?.publicKey
            ?: return null
        
        return KeyPair(publicKey, privateKey)
    }
    
    /**
     * Get public key in PEM format for server enrollment
     * 
     * @return PEM-encoded public key string
     */
    fun getPublicKeyPem(): String? {
        val keyPair = getKeyPair() ?: return null
        
        val publicKeyBytes = keyPair.public.encoded
        val base64 = Base64.encodeToString(publicKeyBytes, Base64.NO_WRAP)
        
        return buildString {
            append("-----BEGIN PUBLIC KEY-----\n")
            // Split into 64-character lines
            base64.chunked(64).forEach { line ->
                append(line)
                append("\n")
            }
            append("-----END PUBLIC KEY-----")
        }
    }
    
    /**
     * Sign data using the private key
     * 
     * This operation requires biometric authentication if the key was created with
     * setUserAuthenticationRequired(true).
     * 
     * Note: Use BiometricPrompt to trigger authentication before calling this method.
     * 
     * @param data Data to sign (typically JSON string)
     * @return Base64-encoded signature
     */
    fun sign(data: ByteArray): String {
        val keyPair = getKeyPair()
            ?: throw IllegalStateException("Key not found. Call generateKeyPair first.")

        val signature = Signature.getInstance(SIGNATURE_ALGORITHM)
        signature.initSign(keyPair.private)
        signature.update(data)

        val signatureBytes = signature.sign()
        return Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
    }

    /**
     * Get a Signature instance initialized with the private key for biometric-bound operations.
     *
     * The returned Signature must be used immediately with a BiometricPrompt CryptoObject.
     */
    fun getInitializedSignature(): Signature? {
        val keyPair = getKeyPair() ?: return null

        val signature = Signature.getInstance(SIGNATURE_ALGORITHM)
        signature.initSign(keyPair.private)
        return signature
    }
    
    /**
     * Verify signature locally (for testing)
     * 
     * @param data Original data
     * @param signatureBase64 Base64-encoded signature
     * @return True if signature is valid
     */
    fun verify(data: ByteArray, signatureBase64: String): Boolean {
        val keyPair = getKeyPair() ?: return false
        
        val signature = Signature.getInstance(SIGNATURE_ALGORITHM)
        signature.initVerify(keyPair.public)
        signature.update(data)
        
        val signatureBytes = Base64.decode(signatureBase64, Base64.NO_WRAP)
        return signature.verify(signatureBytes)
    }
    
    /**
     * Delete the keypair from Keystore
     */
    fun deleteKeyPair() {
        val keyAlias = getKeyAlias(deviceId)
        
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
        keyStore.load(null)
        
        if (keyStore.containsAlias(keyAlias)) {
            keyStore.deleteEntry(keyAlias)
        }
    }
    
    /**
     * Check if keypair exists
     */
    fun hasKeyPair(): Boolean {
        val keyAlias = getKeyAlias(deviceId)
        
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
        keyStore.load(null)
        
        return keyStore.containsAlias(keyAlias)
    }
}
