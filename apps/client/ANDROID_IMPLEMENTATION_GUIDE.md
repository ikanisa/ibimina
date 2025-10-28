# Android Finance Features Implementation Guide

This guide provides code examples and implementation patterns for using the
Android permissions and plugins configured in the Ibimina Client app.

## Table of Contents

1. [SMS and OTP Handling](#sms-and-otp-handling)
2. [Camera and Document Capture](#camera-and-document-capture)
3. [Biometric Authentication](#biometric-authentication)
4. [Push Notifications](#push-notifications)
5. [Location Services](#location-services)
6. [Background Sync](#background-sync)
7. [USSD Dialing](#ussd-dialing)
8. [QR Code Scanning](#qr-code-scanning)

## Prerequisites

All Capacitor plugins are already installed. Import them in your
TypeScript/JavaScript files:

```typescript
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { Device } from "@capacitor/device";
import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
```

## SMS and OTP Handling

### Reading SMS for OTP Auto-fill

```typescript
// lib/utils/sms-otp.ts
export async function requestSMSPermission(): Promise<boolean> {
  // SMS permissions are requested at runtime
  // On Android 13+, you need to request READ_SMS permission
  try {
    // Check if running on Android
    const info = await Device.getInfo();
    if (info.platform !== "android") {
      return false;
    }

    // Request permission through native code
    // This requires a Capacitor plugin or native code
    // For now, guide user to grant permission in settings
    return true;
  } catch (error) {
    console.error("SMS permission error:", error);
    return false;
  }
}

// Listen for SMS messages (requires native implementation)
export function setupSMSListener(callback: (message: string) => void) {
  // This requires a custom Capacitor plugin to listen for SMS
  // Example implementation:

  // 1. Create a broadcast receiver in Android native code
  // 2. Parse incoming SMS for OTP patterns
  // 3. Send OTP to the callback

  // Pattern to match: 6-digit codes
  const OTP_PATTERN = /\b\d{6}\b/;

  // Callback will be called with extracted OTP
  // callback('123456');
}

// Extract OTP from SMS text
export function extractOTP(smsText: string): string | null {
  const patterns = [
    /\b\d{6}\b/, // 6 digits
    /\b\d{4}\b/, // 4 digits
    /OTP[:\s]+(\d+)/i, // "OTP: 123456"
    /code[:\s]+(\d+)/i, // "Code: 123456"
  ];

  for (const pattern of patterns) {
    const match = smsText.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}
```

### Using OTP in Form

```typescript
// components/auth/otp-input.tsx
import { useState, useEffect } from 'react';

export function OTPInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [otp, setOTP] = useState('');

  useEffect(() => {
    // Request SMS permission when component mounts
    requestSMSPermission();

    // Setup SMS listener for auto-fill
    const unsubscribe = setupSMSListener((message) => {
      const extractedOTP = extractOTP(message);
      if (extractedOTP) {
        setOTP(extractedOTP);
        onComplete(extractedOTP);
        Toast.show({ text: 'OTP auto-filled!' });
      }
    });

    return () => unsubscribe?.();
  }, []);

  return (
    <input
      type="text"
      value={otp}
      onChange={(e) => setOTP(e.target.value)}
      maxLength={6}
      placeholder="Enter OTP"
    />
  );
}
```

## Camera and Document Capture

### ID Document Capture

```typescript
// lib/utils/camera.ts
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export async function captureIDDocument(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
      width: 1920,
      height: 1080,
    });

    if (image.base64String) {
      return `data:image/${image.format};base64,${image.base64String}`;
    }

    return null;
  } catch (error) {
    console.error("Camera error:", error);
    await Toast.show({
      text: "Failed to capture image. Please grant camera permission.",
    });
    return null;
  }
}

export async function selectFromGallery(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    if (image.base64String) {
      return `data:image/${image.format};base64,${image.base64String}`;
    }

    return null;
  } catch (error) {
    console.error("Gallery error:", error);
    return null;
  }
}
```

### Using in Component

```typescript
// components/onboarding/id-upload.tsx
import { captureIDDocument, selectFromGallery } from '@/lib/utils/camera';

export function IDUploadSheet() {
  const [imageData, setImageData] = useState<string | null>(null);

  const handleCapture = async () => {
    const data = await captureIDDocument();
    if (data) {
      setImageData(data);
      // Upload to server
      await uploadIDDocument(data);
    }
  };

  const handleGallery = async () => {
    const data = await selectFromGallery();
    if (data) {
      setImageData(data);
      await uploadIDDocument(data);
    }
  };

  return (
    <div>
      <button onClick={handleCapture}>Take Photo</button>
      <button onClick={handleGallery}>Choose from Gallery</button>
      {imageData && <img src={imageData} alt="ID Document" />}
    </div>
  );
}
```

## Biometric Authentication

### Setup Biometric Auth

```typescript
// lib/utils/biometric.ts
import { Device } from "@capacitor/device";

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const info = await Device.getInfo();
    if (info.platform !== "android") {
      return false;
    }

    // Check if device has biometric hardware
    // This requires native implementation
    return true;
  } catch (error) {
    return false;
  }
}

export async function authenticateWithBiometric(
  reason: string = "Authenticate to continue"
): Promise<BiometricResult> {
  try {
    // This requires native Android implementation using BiometricPrompt
    // Example native code needed in MainActivity.java:

    /*
    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
      .setTitle("Biometric Authentication")
      .setSubtitle(reason)
      .setNegativeButtonText("Use PIN")
      .build();
    
    biometricPrompt.authenticate(promptInfo);
    */

    // Return success when biometric is verified
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
```

### Using Biometric in Login

```typescript
// app/(auth)/login/page.tsx
import { authenticateWithBiometric, isBiometricAvailable } from '@/lib/utils/biometric';

export function LoginPage() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleBiometricLogin = async () => {
    const result = await authenticateWithBiometric('Login to Ibimina');

    if (result.success) {
      // Proceed with login
      await signIn();
      Toast.show({ text: 'Login successful!' });
    } else {
      Toast.show({ text: result.error || 'Authentication failed' });
    }
  };

  return (
    <div>
      {biometricAvailable && (
        <button onClick={handleBiometricLogin}>
          Login with Fingerprint
        </button>
      )}
      <button onClick={handlePasswordLogin}>
        Login with Password
      </button>
    </div>
  );
}
```

## Push Notifications

### Setup Push Notifications

```typescript
// lib/utils/push-notifications.ts
import { PushNotifications } from "@capacitor/push-notifications";
import type { PushNotificationSchema } from "@capacitor/push-notifications";

export async function initializePushNotifications() {
  try {
    // Request permission
    const result = await PushNotifications.requestPermissions();

    if (result.receive === "granted") {
      // Register for push notifications
      await PushNotifications.register();
    }

    // Listen for registration
    await PushNotifications.addListener("registration", (token) => {
      console.log("Push registration token:", token.value);
      // Send token to server
      savePushToken(token.value);
    });

    // Listen for push notifications
    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push notification received:", notification);
        // Show local notification if app is in foreground
        showLocalNotification(notification);
      }
    );

    // Handle notification tap
    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Push notification action performed:", notification);
        // Navigate to relevant screen
        handleNotificationTap(notification.notification.data);
      }
    );
  } catch (error) {
    console.error("Push notification setup error:", error);
  }
}

async function savePushToken(token: string) {
  // Save to your backend
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

async function showLocalNotification(notification: PushNotificationSchema) {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: notification.title || "Ibimina",
        body: notification.body || "",
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 1000) },
      },
    ],
  });
}
```

### Using in App

```typescript
// app/layout.tsx
import { initializePushNotifications } from '@/lib/utils/push-notifications';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize push notifications on app start
    initializePushNotifications();
  }, []);

  return <html>{children}</html>;
}
```

## Location Services

### Getting User Location

```typescript
// lib/utils/location.ts
import { Geolocation } from "@capacitor/geolocation";

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export async function getCurrentLocation(): Promise<Location | null> {
  try {
    // Request permission
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted") {
      const request = await Geolocation.requestPermissions();
      if (request.location !== "granted") {
        Toast.show({ text: "Location permission denied" });
        return null;
      }
    }

    // Get current position
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error("Location error:", error);
    Toast.show({ text: "Failed to get location" });
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula for distance in kilometers
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Finding Nearby SACCO Branches

```typescript
// components/saccos/branch-finder.tsx
import { getCurrentLocation, calculateDistance } from '@/lib/utils/location';

interface Branch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

export function BranchFinder() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [nearbyBranches, setNearbyBranches] = useState<Branch[]>([]);

  const findNearbyBranches = async () => {
    const location = await getCurrentLocation();
    if (!location) return;

    // Filter branches within 10km
    const nearby = branches
      .map(branch => ({
        ...branch,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          branch.latitude,
          branch.longitude
        ),
      }))
      .filter(branch => branch.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    setNearbyBranches(nearby);
  };

  return (
    <div>
      <button onClick={findNearbyBranches}>Find Nearby Branches</button>
      <ul>
        {nearbyBranches.map(branch => (
          <li key={branch.id}>
            {branch.name} - {branch.distance.toFixed(2)}km away
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Background Sync

### Setting Up Background Sync Service

```typescript
// lib/utils/background-sync.ts
import { Network } from "@capacitor/network";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";

export async function startBackgroundSync() {
  try {
    // Check if running on Android
    const info = await Device.getInfo();
    if (info.platform !== "android") {
      return;
    }

    // Start foreground service
    await ForegroundService.startForegroundService({
      body: "Syncing transactions...",
      id: 1,
      smallIcon: "ic_stat_icon_config_sample",
      title: "Ibimina Sync",
    });

    // Monitor network status
    const handler = Network.addListener(
      "networkStatusChange",
      async (status) => {
        if (status.connected) {
          await syncPendingTransactions();
        }
      }
    );

    return handler;
  } catch (error) {
    console.error("Background sync error:", error);
  }
}

export async function stopBackgroundSync() {
  try {
    await ForegroundService.stopForegroundService();
  } catch (error) {
    console.error("Stop sync error:", error);
  }
}

async function syncPendingTransactions() {
  // Get pending transactions from local storage
  const pending = await getPendingTransactions();

  for (const transaction of pending) {
    try {
      await submitTransaction(transaction);
      await removePendingTransaction(transaction.id);
    } catch (error) {
      console.error("Transaction sync error:", error);
    }
  }
}
```

## USSD Dialing

### Dialing USSD Codes

```typescript
// lib/utils/ussd.ts
import { App } from "@capacitor/app";

export interface USSDPayment {
  merchantCode: string;
  amount: number;
  reference: string;
}

export async function dialUSSD(payment: USSDPayment) {
  try {
    // Rwanda Mobile Money USSD code: *182*7*1*MERCHANT*AMOUNT*REFERENCE#
    const ussdCode = encodeURIComponent(
      `*182*7*1*${payment.merchantCode}*${payment.amount}*${payment.reference}#`
    );

    // Open dialer with USSD code
    const url = `tel:${ussdCode}`;

    // This will open the phone dialer with the USSD code
    await App.openUrl({ url });

    Toast.show({
      text: "Complete payment in phone dialer",
    });
  } catch (error) {
    console.error("USSD dial error:", error);
    Toast.show({ text: "Failed to open dialer" });
  }
}
```

### Using in Payment Flow

```typescript
// app/pay-sheet/page.tsx
import { dialUSSD } from '@/lib/utils/ussd';

export function PaymentSheet() {
  const handlePayment = async () => {
    const payment = {
      merchantCode: '123456',
      amount: 10000,
      reference: 'NYA.GAS.TWIZ.001',
    };

    await dialUSSD(payment);

    // Wait for user confirmation
    // Show instructions
  };

  return (
    <div>
      <button onClick={handlePayment}>Pay with Mobile Money</button>
    </div>
  );
}
```

## QR Code Scanning

### Scanning QR Codes

```typescript
// lib/utils/qr-scanner.ts
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";

export async function scanQRCode(): Promise<string | null> {
  try {
    // Request camera permission
    const status = await BarcodeScanner.checkPermission({ force: true });

    if (!status.granted) {
      Toast.show({ text: "Camera permission denied" });
      return null;
    }

    // Hide web content
    document.body.classList.add("qr-scanner-active");

    // Start scanning
    const result = await BarcodeScanner.startScan();

    // Show web content
    document.body.classList.remove("qr-scanner-active");

    if (result.hasContent) {
      return result.content;
    }

    return null;
  } catch (error) {
    console.error("QR scan error:", error);
    document.body.classList.remove("qr-scanner-active");
    return null;
  }
}

export async function stopScanning() {
  await BarcodeScanner.stopScan();
  document.body.classList.remove("qr-scanner-active");
}
```

### Using in Component

```typescript
// components/payment/qr-payment.tsx
import { scanQRCode, stopScanning } from '@/lib/utils/qr-scanner';

export function QRPayment() {
  const [scannedData, setScannedData] = useState<string | null>(null);

  const handleScan = async () => {
    const data = await scanQRCode();
    if (data) {
      setScannedData(data);
      // Parse payment data from QR code
      const payment = parseQRPaymentData(data);
      // Process payment
      await processPayment(payment);
    }
  };

  return (
    <div>
      <button onClick={handleScan}>Scan QR Code</button>
      {scannedData && <p>Scanned: {scannedData}</p>}
    </div>
  );
}
```

## CSS for QR Scanner

Add this to your global CSS:

```css
/* app/globals.css */
body.qr-scanner-active {
  visibility: hidden;
  background-color: transparent;
}

body.qr-scanner-active .qr-scanner-overlay {
  visibility: visible;
}
```

## Haptic Feedback

```typescript
// lib/utils/haptics.ts
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export async function successHaptic() {
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function errorHaptic() {
  await Haptics.vibrate({ duration: 500 });
}

export async function selectionHaptic() {
  await Haptics.selectionStart();
  await Haptics.selectionEnd();
}
```

## Network Status Monitoring

```typescript
// lib/utils/network.ts
import { Network } from "@capacitor/network";

export async function monitorNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
) {
  const status = await Network.getStatus();

  if (status.connected) {
    onOnline();
  } else {
    onOffline();
  }

  return Network.addListener("networkStatusChange", (status) => {
    if (status.connected) {
      onOnline();
    } else {
      onOffline();
    }
  });
}
```

## Testing Guide

1. **Test on physical Android device** - Emulators have limited support for:
   - Biometric authentication
   - SMS reading
   - Camera quality
   - Location accuracy

2. **Test permission flows** - Ensure app handles:
   - Permission granted
   - Permission denied
   - Permission permanently denied

3. **Test offline mode** - Verify:
   - Data cached properly
   - Pending transactions queued
   - Sync works when back online

4. **Test on different Android versions**:
   - Android 9 (API 28) - Minimum SDK
   - Android 13 (API 33) - New permission model
   - Android 14 (API 34) - Foreground service restrictions

## Security Best Practices

1. **Never log sensitive data** - SMS content, OTPs, biometric results
2. **Use HTTPS only** - All API calls must be encrypted
3. **Validate all inputs** - Especially from QR codes and SMS
4. **Store sensitive data securely** - Use Android Keystore
5. **Clear sensitive data** - After use or on logout
6. **Request permissions JIT** - Just-in-time, with clear explanation

## Troubleshooting

### Camera not working

- Check permission granted
- Verify camera not in use
- Check physical device (emulator cameras limited)

### SMS not being read

- Verify SMS permission granted
- Check SMS format matches pattern
- Test with actual Mobile Money SMS

### Biometric not available

- Check device has biometric hardware
- Verify user enrolled biometrics
- Provide fallback to PIN/password

### Push notifications not received

- Check notification permission granted
- Verify FCM setup correct
- Check network connectivity

## Next Steps

1. Implement native Capacitor plugins for SMS reading
2. Create biometric authentication plugin
3. Test on physical devices
4. Add analytics for feature usage
5. Implement error tracking
6. Create user documentation
