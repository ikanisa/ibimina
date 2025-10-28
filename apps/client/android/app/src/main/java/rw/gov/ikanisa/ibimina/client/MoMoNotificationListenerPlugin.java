package rw.gov.ikanisa.ibimina.client;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin for MoMo SMS notification listening
 * 
 * This plugin bridges the NotificationListenerService to JavaScript,
 * allowing the web app to receive and process MoMo transaction notifications.
 */
@CapacitorPlugin(name = "MoMoNotificationListener")
public class MoMoNotificationListenerPlugin extends Plugin {
    private static final String TAG = "MoMoNotificationPlugin";
    private BroadcastReceiver smsReceiver;
    
    @Override
    public void load() {
        // Register broadcast receiver for SMS notifications
        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String smsText = intent.getStringExtra(MoMoNotificationListener.EXTRA_SMS_TEXT);
                String appPackage = intent.getStringExtra(MoMoNotificationListener.EXTRA_APP_PACKAGE);
                
                // Send to JavaScript
                JSObject ret = new JSObject();
                ret.put("text", smsText);
                ret.put("source", appPackage);
                ret.put("timestamp", System.currentTimeMillis());
                
                notifyListeners("smsReceived", ret);
            }
        };
        
        IntentFilter filter = new IntentFilter(MoMoNotificationListener.ACTION_SMS_RECEIVED);
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(smsReceiver, filter);
    }
    
    @Override
    protected void handleOnDestroy() {
        if (smsReceiver != null) {
            LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(smsReceiver);
        }
    }
    
    /**
     * Check if notification listener permission is granted
     */
    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = isNotificationServiceEnabled();
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }
    
    /**
     * Request notification listener permission (opens system settings)
     */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open notification settings", e);
        }
    }
    
    /**
     * Check if the notification listener service is enabled
     */
    private boolean isNotificationServiceEnabled() {
        String enabledListeners = Settings.Secure.getString(
            getContext().getContentResolver(),
            "enabled_notification_listeners"
        );
        
        if (enabledListeners == null || enabledListeners.isEmpty()) {
            return false;
        }
        
        String packageName = getContext().getPackageName();
        return enabledListeners.contains(packageName);
    }
}
