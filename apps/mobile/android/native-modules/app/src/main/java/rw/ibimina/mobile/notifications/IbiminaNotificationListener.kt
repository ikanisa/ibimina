package rw.ibimina.mobile.notifications

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class IbiminaNotificationListener : NotificationListenerService() {
  override fun onListenerConnected() {
    super.onListenerConnected()
    Log.i(TAG, "Notification listener connected")
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    super.onNotificationPosted(sbn)
    sbn ?: return
    Log.d(TAG, "Notification posted from ${sbn.packageName}")
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    super.onNotificationRemoved(sbn)
    sbn ?: return
    Log.d(TAG, "Notification removed from ${sbn.packageName}")
  }

  companion object {
    private const val TAG = "IbiminaNotificationListener"
  }
}
