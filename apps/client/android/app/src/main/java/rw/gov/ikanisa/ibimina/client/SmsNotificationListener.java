package rw.gov.ikanisa.ibimina.client;

import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.os.Bundle;
import android.util.Log;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Listens to incoming SMS notifications (from the default SMS app) and forwards
 * MoMo receipts to your Supabase Edge Function for parsing/approval.
 *
 * No READ_SMS/RECEIVE_SMS permissions used.
 */
public class SmsNotificationListener extends NotificationListenerService {
    private static final String TAG = "SACCO_SMS";

    // TODO: replace with your actual Edge Function endpoint
    private static final String SUPABASE_EDGE_URL = "https://<your-supabase-ref>.functions.supabase.co/momo-receipt";
    // Optional bearer if you enforce auth on the function:
    private static final String EDGE_BEARER = ""; // e.g., "Bearer xyz"

    // Basic sender filters (adjust to your region)
    private static final String[] SENDER_HINTS = new String[] {
            "MTN", "AIRTEL", "AIRTELMONEY", "MTNMOMO", "RW-MTN", "RW-AIRTEL"
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            Notification n = sbn.getNotification();
            if (n == null) return;

            Bundle extras = n.extras;
            if (extras == null) return;

            // Pull best-effort text bodies
            CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence big = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence ticker = n.tickerText;

            String pkg = sbn.getPackageName(); // e.g., com.google.android.apps.messaging
            String body = joinNonNull(" ", new CharSequence[]{title, text, big, ticker}).toUpperCase();

            if (body.length() == 0) return;

            // Quick sender/keyword filter to avoid posting unrelated notifications
            boolean looksLikeMomo = false;
            for (String hint : SENDER_HINTS) {
                if (body.contains(hint)) { looksLikeMomo = true; break; }
            }
            // Add money-ish keywords
            if (!looksLikeMomo && (body.contains("PAYMENT") || body.contains("RECEIVED") || body.contains("MOMO"))) {
                looksLikeMomo = true;
            }

            if (!looksLikeMomo) return;

            Log.i(TAG, "MoMo-like notification from " + pkg + ": " + body);

            // POST to your Supabase function
            try {
                postToEdge(SUPABASE_EDGE_URL, pkg, safe(title), safe(text), safe(big), safe(ticker));
            } catch (Exception e) {
                Log.e(TAG, "Edge post failed: " + e.getMessage(), e);
            }
        } catch (Throwable t) {
            Log.e(TAG, "onNotificationPosted error", t);
        }
    }

    private static String safe(CharSequence cs) {
        return cs == null ? "" : cs.toString();
    }

    private static String joinNonNull(String sep, CharSequence[] parts) {
        StringBuilder sb = new StringBuilder();
        for (CharSequence p : parts) {
            if (p != null && p.length() > 0) {
                if (sb.length() > 0) sb.append(sep);
                sb.append(p);
            }
        }
        return sb.toString();
    }

    private static void postToEdge(String urlStr, String pkg, String title, String text, String big, String ticker) throws Exception {
        String payload = "{\"package\":\"" + escape(pkg) + "\","
                + "\"title\":\"" + escape(title) + "\","
                + "\"text\":\"" + escape(text) + "\","
                + "\"big\":\"" + escape(big) + "\","
                + "\"ticker\":\"" + escape(ticker) + "\"}";

        URL url = new URL(urlStr);
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setConnectTimeout(8000);
        c.setReadTimeout(8000);
        c.setDoOutput(true);
        c.setRequestMethod("POST");
        c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        if (EDGE_BEARER != null && !EDGE_BEARER.isEmpty()) {
            c.setRequestProperty("Authorization", EDGE_BEARER);
        }

        byte[] b = payload.getBytes(StandardCharsets.UTF_8);
        c.setFixedLengthStreamingMode(b.length);
        try (OutputStream os = c.getOutputStream()) {
            os.write(b);
        }
        int code = c.getResponseCode();
        Log.i(TAG, "Edge response: " + code);
        c.disconnect();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
