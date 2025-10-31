package com.tapmomo.feature.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

/**
 * Permission utilities
 */
object PermissionUtils {
    
    /**
     * Check if NFC permission is granted (always granted if NFC is available)
     */
    fun hasNfcPermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.NFC
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if CALL_PHONE permission is granted
     */
    fun hasCallPhonePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if READ_PHONE_STATE permission is granted
     */
    fun hasReadPhoneStatePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if CAMERA permission is granted
     */
    fun hasCameraPermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Get all required permissions
     */
    fun getRequiredPermissions(): Array<String> {
        return arrayOf(
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE
        )
    }
    
    /**
     * Get optional permissions (for QR code fallback)
     */
    fun getOptionalPermissions(): Array<String> {
        return arrayOf(
            Manifest.permission.CAMERA
        )
    }
    
    /**
     * Check if all required permissions are granted
     */
    fun hasAllRequiredPermissions(context: Context): Boolean {
        return hasCallPhonePermission(context) && hasReadPhoneStatePermission(context)
    }
}
