package rw.ibimina.mobile.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes

class SmsConsentReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != SmsRetriever.SMS_RETRIEVED_ACTION) {
      return
    }

    val extras = intent.extras ?: return
    val status = extras.get(SmsRetriever.EXTRA_STATUS) as? com.google.android.gms.common.api.Status ?: return

    when (status.statusCode) {
      CommonStatusCodes.SUCCESS -> {
        Log.d(TAG, "SMS consent intent received")
        val consentIntent = extras.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT) ?: return
        val broadcast = Intent(ACTION_CONSENT_READY)
        broadcast.putExtra(EXTRA_CONSENT_INTENT, consentIntent)
        context.sendBroadcast(broadcast)
      }
      CommonStatusCodes.TIMEOUT -> Log.w(TAG, "SMS consent timed out")
      else -> Log.w(TAG, "SMS consent failed with status ${status.statusCode}")
    }
  }

  companion object {
    private const val TAG = "SmsConsentReceiver"
    const val ACTION_CONSENT_READY = "rw.ibimina.mobile.SMS_CONSENT_READY"
    const val EXTRA_CONSENT_INTENT = "consent_intent"
  }
}
