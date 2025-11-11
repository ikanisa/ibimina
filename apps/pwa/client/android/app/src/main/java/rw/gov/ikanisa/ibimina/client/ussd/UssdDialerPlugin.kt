package rw.gov.ikanisa.ibimina.client.ussd

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telecom.TelecomManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

@CapacitorPlugin(
    name = "UssdDialer",
    permissions = [
        Permission(strings = ["android.permission.CALL_PHONE"], alias = "call_phone"),
        Permission(strings = ["android.permission.READ_PHONE_STATE"], alias = "read_phone_state")
    ]
)
class UssdDialerPlugin : Plugin() {

    /**
     * Check if device has multiple SIM cards.
     */
    @PluginMethod
    fun hasDualSim(call: PluginCall) {
        if (!checkPermission(Manifest.permission.READ_PHONE_STATE)) {
            call.reject("Missing READ_PHONE_STATE permission")
            return
        }

        val result = JSObject()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
            val activeSubscriptions = subscriptionManager?.activeSubscriptionInfoList ?: emptyList()
            
            result.put("hasDualSim", activeSubscriptions.size > 1)
            result.put("simCount", activeSubscriptions.size)
        } else {
            result.put("hasDualSim", false)
            result.put("simCount", 1)
        }

        call.resolve(result)
    }

    /**
     * Get list of active SIM cards.
     */
    @PluginMethod
    fun getSimList(call: PluginCall) {
        if (!checkPermission(Manifest.permission.READ_PHONE_STATE)) {
            call.reject("Missing READ_PHONE_STATE permission")
            return
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) {
            call.reject("SIM management requires Android 5.1 or higher")
            return
        }

        val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
        val activeSubscriptions = subscriptionManager?.activeSubscriptionInfoList ?: emptyList()

        val simArray = JSArray()
        
        for (sub in activeSubscriptions) {
            val simInfo = JSObject()
            simInfo.put("subscriptionId", sub.subscriptionId)
            simInfo.put("slotIndex", sub.simSlotIndex)
            simInfo.put("displayName", sub.displayName?.toString() ?: "SIM ${sub.simSlotIndex + 1}")
            simInfo.put("carrierName", sub.carrierName?.toString() ?: "Unknown")
            simInfo.put("countryIso", sub.countryIso ?: "")
            
            // Try to get phone number (may be null)
            if (checkPermission(Manifest.permission.READ_PHONE_STATE)) {
                simInfo.put("phoneNumber", sub.number ?: "")
            }
            
            simArray.put(simInfo)
        }

        val result = JSObject()
        result.put("simCards", simArray)
        result.put("count", activeSubscriptions.size)
        call.resolve(result)
    }

    /**
     * Dial USSD code programmatically (Android 8.0+).
     * Falls back to ACTION_DIAL if sendUssdRequest is not available or fails.
     */
    @PluginMethod
    fun dialUssd(call: PluginCall) {
        val ussdCode = call.getString("ussdCode")
        val subscriptionId = call.getInt("subscriptionId")

        if (ussdCode == null) {
            call.reject("Missing 'ussdCode' parameter")
            return
        }

        if (!checkPermission(Manifest.permission.CALL_PHONE)) {
            // Fall back to dialer intent
            dialWithIntent(ussdCode, call)
            return
        }

        // Try programmatic USSD (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val telephonyManager = if (subscriptionId != null && 
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    context.getSystemService(TelephonyManager::class.java)
                        ?.createForSubscriptionId(subscriptionId)
                } else {
                    context.getSystemService(TelephonyManager::class.java)
                }

                if (telephonyManager == null) {
                    dialWithIntent(ussdCode, call)
                    return
                }

                // Send USSD request
                telephonyManager.sendUssdRequest(
                    ussdCode,
                    object : TelephonyManager.UssdResponseCallback() {
                        override fun onReceiveUssdResponse(
                            telephonyManager: TelephonyManager,
                            request: String,
                            response: CharSequence
                        ) {
                            Log.d(TAG, "USSD response: $response")
                            val result = JSObject()
                            result.put("success", true)
                            result.put("method", "programmatic")
                            result.put("response", response.toString())
                            call.resolve(result)
                        }

                        override fun onReceiveUssdResponseFailed(
                            telephonyManager: TelephonyManager,
                            request: String,
                            failureCode: Int
                        ) {
                            Log.w(TAG, "USSD request failed with code: $failureCode")
                            // Fall back to dialer
                            dialWithIntent(ussdCode, call)
                        }
                    },
                    Handler(Looper.getMainLooper())
                )

                // Don't resolve here - wait for callback
                return

            } catch (e: Exception) {
                Log.e(TAG, "Error sending USSD request", e)
                // Fall back to dialer
                dialWithIntent(ussdCode, call)
                return
            }
        } else {
            // Android < 8.0, use dialer intent
            dialWithIntent(ussdCode, call)
        }
    }

    /**
     * Open dialer with USSD code pre-filled.
     * This is the fallback method and works on all Android versions.
     */
    private fun dialWithIntent(ussdCode: String, call: PluginCall) {
        try {
            // Encode # as %23 for tel: URI
            val encodedUssd = ussdCode.replace("#", "%23")
            val intent = Intent(Intent.ACTION_DIAL)
            intent.data = Uri.parse("tel:$encodedUssd")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK

            activity.startActivity(intent)

            val result = JSObject()
            result.put("success", true)
            result.put("method", "dialer_intent")
            result.put("message", "USSD code opened in dialer")
            call.resolve(result)

        } catch (e: Exception) {
            Log.e(TAG, "Error opening dialer", e)
            call.reject("Failed to open dialer: ${e.message}")
        }
    }

    /**
     * Request CALL_PHONE permission for programmatic USSD.
     */
    @PluginMethod
    fun requestCallPermission(call: PluginCall) {
        if (checkPermission(Manifest.permission.CALL_PHONE)) {
            val result = JSObject()
            result.put("granted", true)
            call.resolve(result)
        } else {
            requestPermissionForAlias("call_phone", call, "callPermissionCallback")
        }
    }

    /**
     * Request READ_PHONE_STATE permission for SIM management.
     */
    @PluginMethod
    fun requestPhoneStatePermission(call: PluginCall) {
        if (checkPermission(Manifest.permission.READ_PHONE_STATE)) {
            val result = JSObject()
            result.put("granted", true)
            call.resolve(result)
        } else {
            requestPermissionForAlias("read_phone_state", call, "phoneStatePermissionCallback")
        }
    }

    /**
     * Check if a permission is granted.
     */
    private fun checkPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            permission
        ) == PackageManager.PERMISSION_GRANTED
    }

    companion object {
        private const val TAG = "UssdDialerPlugin"
    }
}
