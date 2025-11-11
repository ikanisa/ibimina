package rw.gov.ikanisa.ibimina.client

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status
import java.util.regex.Pattern

/**
 * Capacitor plugin that wraps the Android SMS User Consent API.
 *
 * The plugin presents a system consent dialog whenever a matching SMS arrives
 * and only returns the SMS content after the member approves it. This keeps the
 * app compliant with Google Play's SMS/Call Log policy because no background
 * inbox access is requested.
 */
@CapacitorPlugin(name = "SmsUserConsent")
class SmsUserConsentPlugin : Plugin() {

    companion object {
        private const val TAG = "SmsUserConsent"
        private val OTP_PATTERN = Pattern.compile("\\b(\\d{4,8})\\b")
    }

    private var consentReceiver: BroadcastReceiver? = null
    private var activeCall: PluginCall? = null
    private var receiverRegistered = false

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        clearState()
    }

    /**
     * Start listening for SMS that match the consent criteria. The promise
     * resolves only after the user approves the message.
     */
    @PluginMethod
    fun request(call: PluginCall) {
        if (activeCall != null) {
            call.reject("consent_in_progress")
            return
        }

        val activity = activity ?: run {
            call.reject("activity_unavailable")
            return
        }

        val sender = call.getString("sender")
        val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
        val task = client.startSmsUserConsent(sender)

        task.addOnSuccessListener {
            Log.d(TAG, "SMS User Consent listening started")
            registerReceiver()
            activeCall = call
            call.setKeepAlive(true)
            val event = JSObject().apply {
                put("sender", sender)
            }
            notifyListeners("consentStarted", event)
        }.addOnFailureListener { error ->
            Log.e(TAG, "Failed to start SMS User Consent", error)
            call.reject("start_failed", error)
        }
    }

    /**
     * Cancel any active consent session and unregister receivers.
     */
    @PluginMethod
    fun cancel(call: PluginCall) {
        Log.d(TAG, "Cancelling SMS User Consent listener")
        clearState()
        call.resolve()
    }

    private fun registerReceiver() {
        if (receiverRegistered) {
            return
        }

        consentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != SmsRetriever.SMS_RETRIEVED_ACTION) {
                    return
                }

                val extras = intent.extras ?: return
                val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

                when (status.statusCode) {
                    CommonStatusCodes.SUCCESS -> {
                        val consentIntent = extras.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
                        val call = activeCall ?: return

                        if (consentIntent == null) {
                            Log.w(TAG, "Consent intent missing from SMS retriever payload")
                            call.reject("intent_missing")
                            clearState()
                            return
                        }

                        try {
                            startActivityForResult(call, consentIntent, "handleConsentResult")
                        } catch (ex: Exception) {
                            Log.e(TAG, "Failed to launch consent dialog", ex)
                            call.reject("dialog_failed", ex)
                            clearState()
                        }
                    }
                    CommonStatusCodes.TIMEOUT -> {
                        Log.w(TAG, "SMS User Consent timed out")
                        activeCall?.reject("timeout")
                        notifyListeners("consentTimeout", null)
                        clearState()
                    }
                    else -> {
                        Log.w(TAG, "Unexpected status: ${status.statusCode}")
                        activeCall?.reject("unavailable")
                        clearState()
                    }
                }
            }
        }

        val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(consentReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(consentReceiver, filter)
        }
        receiverRegistered = true
    }

    private fun unregisterReceiver() {
        if (!receiverRegistered) {
            return
        }

        try {
            context.unregisterReceiver(consentReceiver)
        } catch (error: IllegalArgumentException) {
            Log.w(TAG, "Receiver already unregistered", error)
        }

        consentReceiver = null
        receiverRegistered = false
    }

    private fun clearState() {
        unregisterReceiver()
        activeCall?.let { call ->
            call.setKeepAlive(false)
            call.release(bridge)
        }
        activeCall = null
    }

    private fun extractOtp(message: String?): String? {
        if (message.isNullOrBlank()) {
            return null
        }

        val matcher = OTP_PATTERN.matcher(message)
        return if (matcher.find()) {
            matcher.group(1)
        } else {
            null
        }
    }

    @ActivityCallback
    private fun handleConsentResult(call: PluginCall, result: ActivityResult) {
        val data = result.data
        val resolvedCall = activeCall ?: call

        when (result.resultCode) {
            Activity.RESULT_OK -> {
                val message = data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)
                val payload = JSObject().apply {
                    put("message", message)
                    put("otp", extractOtp(message))
                    put("receivedAt", System.currentTimeMillis())
                }

                Log.d(TAG, "SMS consent approved")
                resolvedCall.resolve(payload)
                notifyListeners("smsReceived", payload)
            }
            Activity.RESULT_CANCELED -> {
                Log.i(TAG, "User dismissed SMS consent dialog")
                resolvedCall.reject("cancelled")
            }
            else -> {
                Log.w(TAG, "Consent result code: ${result.resultCode}")
                resolvedCall.reject("consent_failed")
            }
        }

        clearState()
    }
}
