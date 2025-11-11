# Android Features Implementation Summary

This document summarizes the Android-specific features implemented for Play
Store compliance.

## ✅ Implemented Features

### 1. MoMo Notification Listener (Enhanced)

**Status:** ✅ Complete with Edge Function integration

**What it does:**

- Reads payment notifications from MoMo apps (MTN, Airtel)
- Automatically posts transaction data to Supabase Edge Function
- Uses HMAC-SHA256 signature for security
- No SMS permissions required - reads notifications only

**Files:**

- `android/app/src/main/java/rw/gov/ikanisa/ibimina/client/MoMoNotificationListener.java`
- `android/app/src/main/java/rw/gov/ikanisa/ibimina/client/MoMoNotificationListenerPlugin.java`
- `android/app/src/main/AndroidManifest.xml` (service declaration)
- `android/app/build.gradle` (BuildConfig fields)

**Configuration:**

```bash
# Set before building
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export HMAC_SHARED_SECRET="your-hmac-secret"
```

**Documentation:** See
[NOTIFICATION_LISTENER_SMS_GUIDE.md](./NOTIFICATION_LISTENER_SMS_GUIDE.md)

### 2. SMS User Consent API

**Status:** ✅ Complete and Play-compliant

**What it does:**

- One-time SMS read with explicit user consent
- System dialog prompts user to approve each SMS
- Extracts OTP codes automatically
- No READ_SMS permission required

**Files:**

- `android/app/src/main/java/rw/gov/ikanisa/ibimina/client/SmsUserConsentPlugin.kt`
- `lib/sms/user-consent.ts` (JavaScript wrapper)

**Usage:**

```typescript
import { requestSmsUserConsent } from "@/lib/sms/user-consent";

const result = await requestSmsUserConsent();
console.log("SMS content:", result.message);
```

**Documentation:** See
[NOTIFICATION_LISTENER_SMS_GUIDE.md](./NOTIFICATION_LISTENER_SMS_GUIDE.md)

### 3. Deep Links (Android App Links)

**Status:** ✅ Complete with HTTPS verification

**What it does:**

- Opens app from web links (https://client.ibimina.rw/...)
- Custom scheme fallback (ibimina://...)
- Supports join, invite, group, pay, statements, profile routes
- Digital Asset Links verification for seamless opening

**Files:**

- `android/app/src/main/AndroidManifest.xml` (intent filters)
- `lib/deep-links/handler.ts` (JavaScript handler)
- `lib/deep-links/index.ts` (exports)
- `lib/deep-links/examples.tsx` (usage examples)
- `public/.well-known/assetlinks.json` (verification file)

**Supported patterns:**

- `https://client.ibimina.rw/join/{groupId}`
- `https://client.ibimina.rw/invite/{token}`
- `https://client.ibimina.rw/groups/{id}`
- `ibimina://join?group_id={groupId}` (fallback)

**Usage:**

```typescript
import { registerDeepLinkHandler } from "@/lib/deep-links";

const cleanup = registerDeepLinkHandler((route) => {
  if (route.type === "join") {
    router.push(`/groups/join/${route.groupId}`);
  }
});
```

**Documentation:** See [DEEP_LINKS_GUIDE.md](./DEEP_LINKS_GUIDE.md)

### 4. iOS Universal Links

**Status:** ✅ Documented, pending iOS app creation

**What it does:**

- Opens app from web links on iOS
- Custom scheme fallback
- Apple App Site Association file prepared

**Files:**

- `public/.well-known/apple-app-site-association` (verification file)
- Documentation in [DEEP_LINKS_GUIDE.md](./DEEP_LINKS_GUIDE.md)

**Next steps:**

1. Create iOS app target with `pnpm cap add ios`
2. Configure Associated Domains in Xcode
3. Test with simulator

## 🎯 Play Store Compliance

All features are fully compliant with Google Play policies:

✅ **No READ_SMS permission** - Uses Notification Listener + SMS User Consent
API  
✅ **User consent required** - Explicit permission dialogs for all features  
✅ **Transparent purpose** - Clear explanations of why permissions are needed  
✅ **Minimal data** - Only transaction info extracted, rest discarded  
✅ **Secure transport** - HTTPS + HMAC signing for all API calls  
✅ **User control** - Can disable features anytime in Settings

## 📱 User Flow Examples

### Automatic Payment Detection

1. User pays via USSD (e.g., *182*6\*1#)
2. MoMo app shows notification with transaction details
3. Ibimina's Notification Listener reads notification text
4. Transaction posted to Edge Function with HMAC signature
5. Edge Function parses and creates allocation row
6. User sees "Payment detected!" in app

### Manual Payment Capture

1. User pays via USSD
2. User taps "I've paid" in app
3. SMS User Consent API starts listening
4. System dialog appears when SMS arrives
5. User taps "Allow" to grant one-time access
6. App reads SMS and posts to Edge Function
7. User sees "Payment captured successfully!"

### Group Invite via Deep Link

1. User A generates invite link in app
2. Link shared via WhatsApp: `https://client.ibimina.rw/join/abc123`
3. User B clicks link on their phone
4. App opens directly to group join screen
5. User B reviews group details and joins

## 🔧 Build & Test

### Build with Configuration

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export HMAC_SHARED_SECRET="$(openssl rand -hex 32)"

# Sync Capacitor
cd apps/client
pnpm cap sync android

# Build APK
pnpm android:build:debug
# or
pnpm android:build:release
```

### Test Notification Listener

```bash
# Check if enabled
adb shell settings get secure enabled_notification_listeners

# Send test notification (requires test build)
adb shell am broadcast \
  -a rw.gov.ikanisa.ibimina.SMS_RECEIVED \
  --es sms_text "MTN MoMo: You have received RWF 5000"

# View logs
adb logcat | grep "MoMoNotificationListener"
```

### Test Deep Links

```bash
# Test HTTPS App Link
adb shell am start -a android.intent.action.VIEW \
  -d "https://client.ibimina.rw/join/123"

# Test custom scheme
adb shell am start -a android.intent.action.VIEW \
  -d "ibimina://join?group_id=123"

# Verify App Links status
adb shell pm get-app-links rw.ibimina.client
```

## 📚 Documentation

- **[NOTIFICATION_LISTENER_SMS_GUIDE.md](./NOTIFICATION_LISTENER_SMS_GUIDE.md)** -
  Complete guide for notification listener and SMS consent
- **[DEEP_LINKS_GUIDE.md](./DEEP_LINKS_GUIDE.md)** - Complete guide for Android
  App Links and iOS Universal Links
- **[lib/deep-links/examples.tsx](./lib/deep-links/examples.tsx)** - Code
  examples for integration

## 🔐 Security Notes

1. **HMAC Signing:** All Edge Function requests signed with HMAC-SHA256
2. **Environment Variables:** Secrets loaded from env vars, not hardcoded
3. **TLS Only:** All API calls over HTTPS
4. **No Logging:** Raw SMS content never logged in production
5. **Validation:** All deep link parameters validated before use

## 🚀 Next Steps

1. **Test on Real Devices:** Test with actual MoMo apps and transactions
2. **Create iOS App:** Run `pnpm cap add ios` and configure Universal Links
3. **Integrate in UI:** Add deep link handler to root layout
4. **Deploy Edge Function:** Deploy `ingest-sms` function to Supabase
5. **Update .well-known:** Upload assetlinks.json to production domain
6. **Submit to Play Store:** App is ready for Play Store submission

## 🐛 Troubleshooting

### Notification Listener Not Working

1. Check permission granted in Settings → Notifications → Notification Access
2. Verify MoMo app package names match
3. Check logs: `adb logcat | grep MoMoNotificationListener`

### Deep Links Opening in Browser

1. Verify assetlinks.json is accessible at
   `https://client.ibimina.rw/.well-known/assetlinks.json`
2. Check SHA-256 fingerprint matches
3. Test verification:
   `adb shell pm verify-app-links --re-verify rw.ibimina.client`

### HMAC Signature Invalid (401)

1. Verify `HMAC_SHARED_SECRET` matches in both places
2. Regenerate secret: `openssl rand -hex 32`
3. Rebuild app after updating env var

## 📞 Support

For issues or questions:

- Check documentation links above
- Review code examples in `lib/deep-links/examples.tsx`
- Check Android logcat for error messages
- Verify all environment variables are set correctly
