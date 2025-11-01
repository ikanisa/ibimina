package rw.gov.ikanisa.ibimina.client;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

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
 * - Posts to secure Edge Function with HMAC verification
 * 
 * @see <a href="https://developer.android.com/reference/android/service/notification/NotificationListenerService">NotificationListenerService</a>
 */
public class MoMoNotificationListener extends NotificationListenerService {
    private static final String TAG = "MoMoNotificationListener";
    public static final String ACTION_SMS_RECEIVED = "rw.gov.ikanisa.ibimina.SMS_RECEIVED";
    public static final String EXTRA_SMS_TEXT = "sms_text";
    public static final String EXTRA_APP_PACKAGE = "app_package";
    
    // Thread pool for async Edge Function posting
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    
    // MoMo app package names to monitor
    // Note: These package names should be verified against actual app installations
    // MTN MoMo Rwanda: Package name may vary
    // Airtel Money Rwanda: Package name may vary
    // TODO: Verify actual package names on target devices
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
            
            // Broadcast to app (for immediate UI feedback)
            Intent intent = new Intent(ACTION_SMS_RECEIVED);
            intent.putExtra(EXTRA_SMS_TEXT, fullText);
            intent.putExtra(EXTRA_APP_PACKAGE, packageName);
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
            
            // Post to Edge Function (async, with HMAC)
            postToEdgeFunction(fullText, packageName);
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }
    
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for our use case
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
    
    /**
     * Check if the package is a MoMo app we want to monitor
     */
    private boolean isMoMoApp(String packageName) {
        return MTN_MOMO_PACKAGE.equals(packageName) || 
               AIRTEL_MONEY_PACKAGE.equals(packageName);
    }
    
    /**
     * Post notification content to Edge Function with HMAC signature
     * Runs on background thread to avoid blocking the notification service
     */
    private void postToEdgeFunction(final String smsText, final String packageName) {
        executorService.execute(() -> {
            HttpURLConnection connection = null;
            try {
                // Get configuration from BuildConfig
                String supabaseUrl = BuildConfig.SUPABASE_URL;
                String hmacSecret = BuildConfig.HMAC_SHARED_SECRET;
                
                // Skip if not configured (exact check for placeholders)
                if ("https://placeholder.supabase.co".equals(supabaseUrl) || 
                    "placeholder-secret".equals(hmacSecret)) {
                    Log.w(TAG, "Edge Function URL or HMAC secret not configured, skipping post");
                    return;
                }
                
                // Build JSON payload
                JSONObject payload = new JSONObject();
                payload.put("country_iso2", "RW");
                payload.put("telco", getTelcoFromPackage(packageName));
                payload.put("sms", smsText);
                
                String payloadString = payload.toString();
                byte[] payloadBytes = payloadString.getBytes(StandardCharsets.UTF_8);
                
                // Compute HMAC signature
                String signature = computeHmacSha256(hmacSecret, payloadBytes);
                
                // Make HTTP request
                URL url = new URL(supabaseUrl + "/functions/v1/ingest-sms");
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("x-signature", signature);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                
                // Write payload
                try (OutputStream os = connection.getOutputStream()) {
                    os.write(payloadBytes);
                    os.flush();
                }
                
                // Check response
                int responseCode = connection.getResponseCode();
                if (responseCode >= 200 && responseCode < 300) {
                    Log.i(TAG, "Successfully posted to Edge Function: " + responseCode);
                } else {
                    Log.w(TAG, "Edge Function returned error: " + responseCode);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to post to Edge Function", e);
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }
    
    /**
     * Extract telco name from package name
     */
    private String getTelcoFromPackage(String packageName) {
        if (packageName.contains("mtn")) {
            return "MTN";
        } else if (packageName.contains("airtel")) {
            return "Airtel";
        }
        return "Unknown";
    }
    
    /**
     * Compute HMAC-SHA256 signature
     * @throws java.security.NoSuchAlgorithmException if HmacSHA256 is not available
     * @throws java.security.InvalidKeyException if the key is invalid
     */
    private String computeHmacSha256(String secret, byte[] data) 
            throws java.security.NoSuchAlgorithmException, 
                   java.security.InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data);
        
        // Convert to hex string
        StringBuilder hexString = new StringBuilder();
        for (byte b : rawHmac) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
