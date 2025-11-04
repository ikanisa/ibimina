package rw.ibimina.staffadmin;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
  name = "SmsReader",
  permissions = {
    @Permission(
      strings = { 
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS 
      },
      alias = "sms"
    )
  }
)
public class SmsPlugin extends Plugin {

  private static final String PERMISSION_DENIED = "SMS_PERMISSION_DENIED";
  private static final String READ_ERROR = "SMS_READ_ERROR";

  @PluginMethod
  public void requestPermissions(PluginCall call) {
    if (hasRequiredPermissions()) {
      JSObject result = new JSObject();
      result.put("granted", true);
      call.resolve(result);
    } else {
      requestPermissionForAlias("sms", call, "permissionsCallback");
    }
  }

  @PermissionCallback
  private void permissionsCallback(PluginCall call) {
    if (hasRequiredPermissions()) {
      JSObject result = new JSObject();
      result.put("granted", true);
      call.resolve(result);
    } else {
      JSObject result = new JSObject();
      result.put("granted", false);
      result.put("message", "SMS permissions denied by user");
      call.resolve(result);
    }
  }

  @PluginMethod
  public void readSms(PluginCall call) {
    if (!hasRequiredPermissions()) {
      call.reject(PERMISSION_DENIED, "SMS read permission not granted");
      return;
    }

    String sender = call.getString("sender", "");
    Integer limit = call.getInt("limit", 100);
    Long sinceTimestamp = call.getLong("since", 0L);

    try {
      JSArray messages = new JSArray();
      Uri uri = Uri.parse("content://sms/inbox");
      
      String selection = null;
      String[] selectionArgs = null;

      if (!sender.isEmpty()) {
        selection = "address LIKE ?";
        selectionArgs = new String[] { "%" + sender + "%" };
      }

      if (sinceTimestamp > 0) {
        if (selection == null) {
          selection = "date >= ?";
          selectionArgs = new String[] { String.valueOf(sinceTimestamp) };
        } else {
          selection += " AND date >= ?";
          String[] newArgs = new String[selectionArgs.length + 1];
          System.arraycopy(selectionArgs, 0, newArgs, 0, selectionArgs.length);
          newArgs[selectionArgs.length] = String.valueOf(sinceTimestamp);
          selectionArgs = newArgs;
        }
      }

      Cursor cursor = getContext().getContentResolver().query(
        uri,
        new String[] { "_id", "address", "body", "date", "type" },
        selection,
        selectionArgs,
        "date DESC LIMIT " + limit
      );

      if (cursor != null) {
        int count = 0;
        while (cursor.moveToNext() && count < limit) {
          long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
          
          JSObject message = new JSObject();
          message.put("id", cursor.getString(cursor.getColumnIndexOrThrow("_id")));
          message.put("sender", cursor.getString(cursor.getColumnIndexOrThrow("address")));
          message.put("body", cursor.getString(cursor.getColumnIndexOrThrow("body")));
          message.put("timestamp", timestamp);
          message.put("type", cursor.getInt(cursor.getColumnIndexOrThrow("type")));
          
          messages.put(message);
          count++;
        }
        cursor.close();
      }

      JSObject result = new JSObject();
      result.put("messages", messages);
      result.put("count", messages.length());
      call.resolve(result);
      
    } catch (Exception e) {
      call.reject(READ_ERROR, "Failed to read SMS: " + e.getMessage(), e);
    }
  }

  @PluginMethod
  public void checkPermissions(PluginCall call) {
    JSObject result = new JSObject();
    result.put("granted", hasRequiredPermissions());
    result.put("readSms", hasPermission(Manifest.permission.READ_SMS));
    result.put("receiveSms", hasPermission(Manifest.permission.RECEIVE_SMS));
    call.resolve(result);
  }

  private boolean hasRequiredPermissions() {
    return hasPermission(Manifest.permission.READ_SMS) && 
           hasPermission(Manifest.permission.RECEIVE_SMS);
  }

  private boolean hasPermission(String permission) {
    return ContextCompat.checkSelfPermission(getContext(), permission) 
           == PackageManager.PERMISSION_GRANTED;
  }
}
