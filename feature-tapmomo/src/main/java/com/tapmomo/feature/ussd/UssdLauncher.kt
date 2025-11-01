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
import com.tapmomo.feature.internal.TestHooks
import com.tapmomo.feature.telemetry.TelemetryLogger

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
        val template = config.ussdTemplateBundle.get(network) ?: return false
        
        // Build USSD code
        val ussdCode = buildUssdCode(template, merchantId, amount, config.useUssdShortcutWhenAmountPresent)

        TelemetryLogger.track(
            "tapmomo_ussd_launch_attempt",
            mapOf(
                "network" to network.name,
                "hasAmount" to (amount != null),
                "subscriptionProvided" to (subscriptionId != null),
            ),
        )

        TestHooks.ussdDirectHandler?.let { handler ->
            val handled = handler(context, ussdCode, subscriptionId)
            if (handled) {
                TelemetryLogger.track(
                    "tapmomo_ussd_launch",
                    mapOf("method" to "test_override", "network" to network.name),
                )
                return true
            }
        }

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
            TelemetryLogger.track("tapmomo_ussd_permission_missing")
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
            val encodedUssd = ussdCode.replace("#", "%23")
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
