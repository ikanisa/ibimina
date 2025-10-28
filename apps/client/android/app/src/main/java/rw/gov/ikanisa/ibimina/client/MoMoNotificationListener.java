package rw.gov.ikanisa.ibimina.client;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

/**
 * NotificationListenerService for capturing Mobile Money SMS notifications
 * 
 * This service listens for notifications from MoMo apps (MTN, Airtel) and
 * extracts transaction information for automatic payment confirmation.
 * 
 * Play Store Compliance:
 * - Only reads notifications from specific financial apps
 * - User must explicitly grant notification access permission
 * - Extracts only transaction-related data
 * - Does not store or transmit sensitive information
 * 
 * @see <a href="https://developer.android.com/reference/android/service/notification/NotificationListenerService">NotificationListenerService</a>
 */
public class MoMoNotificationListener extends NotificationListenerService {
    private static final String TAG = "MoMoNotificationListener";
    public static final String ACTION_SMS_RECEIVED = "rw.gov.ikanisa.ibimina.SMS_RECEIVED";
    public static final String EXTRA_SMS_TEXT = "sms_text";
    public static final String EXTRA_APP_PACKAGE = "app_package";
    
    // MoMo app package names to monitor
    private static final String MTN_MOMO_PACKAGE = "rw.mtn.momo";
    private static final String AIRTEL_MONEY_PACKAGE = "com.airtel.money";
    
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        
        // Only process notifications from MoMo apps
        if (!isMoMoApp(packageName)) {
            return;
        }
        
        try {
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;
            
            if (extras == null) {
                return;
            }
            
            // Extract notification text
            CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            
            // Build full SMS text from available fields
            StringBuilder smsText = new StringBuilder();
            if (title != null) {
                smsText.append(title).append(" ");
            }
            if (bigText != null) {
                smsText.append(bigText);
            } else if (text != null) {
                smsText.append(text);
            }
            
            String fullText = smsText.toString().trim();
            
            if (fullText.isEmpty()) {
                return;
            }
            
            Log.d(TAG, "MoMo notification received from " + packageName);
            
            // Broadcast to app
            Intent intent = new Intent(ACTION_SMS_RECEIVED);
            intent.putExtra(EXTRA_SMS_TEXT, fullText);
            intent.putExtra(EXTRA_APP_PACKAGE, packageName);
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }
    
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for our use case
    }
    
    /**
     * Check if the package is a MoMo app we want to monitor
     */
    private boolean isMoMoApp(String packageName) {
        return MTN_MOMO_PACKAGE.equals(packageName) || 
               AIRTEL_MONEY_PACKAGE.equals(packageName);
    }
}
