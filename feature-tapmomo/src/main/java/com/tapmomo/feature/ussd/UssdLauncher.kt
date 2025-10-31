package com.tapmomo.feature.ussd

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.tapmomo.feature.Network
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.UssdTemplate

/**
 * USSD launcher for initiating mobile money payments
 */
object UssdLauncher {
    
    /**
     * Launch USSD payment code
     */
    fun launchUssd(
        context: Context,
        network: Network,
        merchantId: String,
        amount: Int?,
        subscriptionId: Int? = null
    ): Boolean {
        val config = TapMoMo.getConfig()
        val template = config.ussdTemplates[network] ?: return false
        
        // Build USSD code
        val ussdCode = buildUssdCode(template, merchantId, amount, config.useUssdShortcutWhenAmountPresent)
        
        // Try TelephonyManager.sendUssdRequest first (API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (trySendUssdRequest(context, ussdCode, subscriptionId)) {
                return true
            }
        }
        
        // Fallback to ACTION_DIAL
        return launchUssdViaDial(context, ussdCode)
    }
    
    /**
     * Build USSD code from template
     */
    private fun buildUssdCode(
        template: UssdTemplate,
        merchantId: String,
        amount: Int?,
        useShortcut: Boolean
    ): String {
        return when {
            amount != null && useShortcut -> {
                template.shortcut
                    .replace("{MERCHANT}", merchantId)
                    .replace("{AMOUNT}", amount.toString())
            }
            else -> {
                template.menu.replace("{MERCHANT}", merchantId)
            }
        }
    }
    
    /**
     * Try to send USSD request using TelephonyManager (API 26+)
     */
    private fun trySendUssdRequest(
        context: Context,
        ussdCode: String,
        subscriptionId: Int?
    ): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false
        }
        
        // Check permission
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) 
            != PackageManager.PERMISSION_GRANTED) {
            return false
        }
        
        try {
            val telephonyManager = if (subscriptionId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
                    ?.createForSubscriptionId(subscriptionId)
            } else {
                context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            } ?: return false
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                telephonyManager.sendUssdRequest(
                    ussdCode,
                    object : TelephonyManager.UssdResponseCallback() {
                        override fun onReceiveUssdResponse(
                            telephonyManager: TelephonyManager?,
                            request: String?,
                            response: CharSequence?
                        ) {
                            // USSD response received
                        }
                        
                        override fun onReceiveUssdResponseFailed(
                            telephonyManager: TelephonyManager?,
                            request: String?,
                            failureCode: Int
                        ) {
                            // USSD failed, user should complete manually
                        }
                    },
                    android.os.Handler(android.os.Looper.getMainLooper())
                )
                return true
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
            return false
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
        
        return false
    }
    
    /**
     * Launch USSD via ACTION_DIAL intent (fallback)
     */
    private fun launchUssdViaDial(context: Context, ussdCode: String): Boolean {
        try {
            // Encode # as %23 for proper URI handling
            val encodedUssd = ussdCode.replace("#", "%23")
            val uri = Uri.parse("tel:$encodedUssd")
            
            val intent = Intent(Intent.ACTION_DIAL, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            context.startActivity(intent)
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }
    
    /**
     * Get USSD preview (for display purposes)
     */
    fun getUssdPreview(
        network: Network,
        merchantId: String,
        amount: Int?
    ): String {
        val config = TapMoMo.getConfig()
        val template = config.ussdTemplates[network] ?: return ""
        
        return buildUssdCode(template, merchantId, amount, config.useUssdShortcutWhenAmountPresent)
    }
}
