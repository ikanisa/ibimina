package com.tapmomo.feature.ussd

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.telephony.TelephonyManager
import androidx.annotation.VisibleForTesting
import androidx.core.content.ContextCompat
import com.tapmomo.feature.Network
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.UssdTemplate
import com.tapmomo.feature.internal.TestHooks
import com.tapmomo.feature.telemetry.TelemetryLogger

/**
 * USSD launcher for initiating mobile money payments
 */
sealed class UssdLaunchResult {
    object Success : UssdLaunchResult()
    data class PermissionRequired(val permissions: Array<String>) : UssdLaunchResult()
    data class Failure(val reason: String? = null) : UssdLaunchResult()
}

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
    ): UssdLaunchResult {
        val config = TapMoMo.getConfig()
        val template = config.ussdTemplates[network]
            ?: return UssdLaunchResult.Failure("Unsupported network")

        // Build USSD code
        val ussdCode = try {
            buildUssdCode(template, merchantId, amount, config.useUssdShortcutWhenAmountPresent)
        } catch (e: IllegalArgumentException) {
            return UssdLaunchResult.Failure(e.message)
        }

        val permissionsNeeded = mutableListOf<String>()
        if (!hasPermission(context, Manifest.permission.CALL_PHONE)) {
            permissionsNeeded.add(Manifest.permission.CALL_PHONE)
        }

        if (!hasPermission(context, Manifest.permission.READ_PHONE_STATE)) {
            permissionsNeeded.add(Manifest.permission.READ_PHONE_STATE)
        }

        if (permissionsNeeded.isNotEmpty()) {
            return UssdLaunchResult.PermissionRequired(permissionsNeeded.distinct().toTypedArray())
        }

        // Try TelephonyManager.sendUssdRequest first (API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (trySendUssdRequest(context, ussdCode, subscriptionId)) {
                return UssdLaunchResult.Success
            }
        }

        // Fallback to ACTION_DIAL
        return if (launchUssdViaDial(context, ussdCode)) {
            UssdLaunchResult.Success
        } else {
            UssdLaunchResult.Failure()
        }
    }

    /**
     * Build USSD code from template
     */
    @VisibleForTesting
    internal fun buildUssdCode(
        template: UssdTemplate,
        merchantId: String,
        amount: Int?,
        useShortcut: Boolean
    ): String {
        val sanitizedMerchant = merchantId.trim()
        require(sanitizedMerchant.isNotEmpty()) { "Merchant ID is required" }

        if (amount != null && amount < 0) {
            throw IllegalArgumentException("Amount must be positive")
        }

        val shouldUseShortcut = amount != null && amount > 0 && useShortcut

        return if (shouldUseShortcut) {
            template.shortcut
                .replace("{MERCHANT}", sanitizedMerchant)
                .replace("{AMOUNT}", amount!!.toString())
        } else {
            template.menu.replace("{MERCHANT}", sanitizedMerchant)
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
        if (!hasPermission(context, Manifest.permission.CALL_PHONE)) {
            return false
        }

        if (subscriptionId != null && !hasPermission(context, Manifest.permission.READ_PHONE_STATE)) {
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
                            TelemetryLogger.track(
                                "tapmomo_ussd_response",
                                mapOf(
                                    "success" to true,
                                    "responseLength" to (response?.length ?: 0),
                                ),
                            )
                        }

                        override fun onReceiveUssdResponseFailed(
                            telephonyManager: TelephonyManager?,
                            request: String?,
                            failureCode: Int
                        ) {
                            TelemetryLogger.track(
                                "tapmomo_ussd_response",
                                mapOf(
                                    "success" to false,
                                    "failureCode" to failureCode,
                                ),
                            )
                        }
                    },
                    android.os.Handler(android.os.Looper.getMainLooper())
                )
                TelemetryLogger.track(
                    "tapmomo_ussd_launch",
                    mapOf("method" to "telephony"),
                )
                return true
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
            TelemetryLogger.track(
                "tapmomo_ussd_launch_failed",
                mapOf("reason" to "security_exception"),
            )
            return false
        } catch (e: Exception) {
            e.printStackTrace()
            TelemetryLogger.track(
                "tapmomo_ussd_launch_failed",
                mapOf("reason" to e.javaClass.simpleName ?: "unknown"),
            )
            return false
        }

        return false
    }
    
    /**
     * Launch USSD via ACTION_DIAL intent (fallback)
     */
    private fun launchUssdViaDial(context: Context, ussdCode: String): Boolean {
        TestHooks.ussdDialHandler?.let { handler ->
            val handled = handler(context, ussdCode)
            if (handled) {
                TelemetryLogger.track(
                    "tapmomo_ussd_launch",
                    mapOf("method" to "test_override_dial"),
                )
                return true
            }
        }
        try {
            // Encode # as %23 for proper URI handling
            val encodedUssd = encodeForDialer(ussdCode)
            val uri = Uri.parse("tel:$encodedUssd")

            val intent = Intent(Intent.ACTION_DIAL, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            context.startActivity(intent)
            TelemetryLogger.track(
                "tapmomo_ussd_launch",
                mapOf("method" to "dial_intent"),
            )
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            TelemetryLogger.track(
                "tapmomo_ussd_launch_failed",
                mapOf("reason" to "dial_intent_exception"),
            )
            return false
        }
    }

    private fun hasPermission(context: Context, permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun encodeForDialer(ussdCode: String): String {
        return ussdCode.replace("#", Uri.encode("#"))
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
        val template = config.ussdTemplateBundle.get(network) ?: return ""
        
        return buildUssdCode(template, merchantId, amount, config.useUssdShortcutWhenAmountPresent)
    }
}
