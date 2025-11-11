# Android Permissions and Features Documentation

## Overview

This document details all permissions, features, and components configured for
the Ibimina Client Android app to function as a comprehensive finance super app
for SACCO operations.

## Permissions

### Core Network Permissions

#### `INTERNET`

- **Purpose**: Enable network communication for API calls, data sync, and
  real-time updates
- **Required**: Yes
- **Use Cases**:
  - API communication with Supabase backend
  - Real-time transaction updates
  - Mobile Money integrations
  - Data synchronization

#### `ACCESS_NETWORK_STATE`

- **Purpose**: Check network connectivity status
- **Required**: Yes
- **Use Cases**:
  - Determine when to enable offline mode
  - Queue transactions for later sync
  - Show appropriate UI based on connectivity

#### `ACCESS_WIFI_STATE`

- **Purpose**: Monitor WiFi connectivity
- **Required**: No
- **Use Cases**:
  - Optimize data usage by preferring WiFi for large transfers
  - Background sync scheduling

#### `CHANGE_NETWORK_STATE` / `CHANGE_WIFI_STATE`

- **Purpose**: Allow app to manage network connections
- **Required**: No
- **Use Cases**:
  - Switch between mobile data and WiFi for optimal performance

### SMS Access Strategy (Play Store Compliant)

The public Play Store build no longer requests the legacy `SEND_SMS`,
`RECEIVE_SMS`, or `READ_SMS` permissions. Instead we combine two capabilities:

- **Notification Listener (`BIND_NOTIFICATION_LISTENER_SERVICE`)** – captures
  the text that MTN MoMo and Airtel Money place in the Android notification
  shade. This delivers immediate transaction context without reading the inbox.
- **SMS User Consent API** – prompts the member with a system dialog for a
  _single_ SMS. The message is only shared if the member explicitly approves it,
  satisfying Google's SMS/Call Log policy requirements.

This hybrid approach keeps Mobile Money reconciliation automated while avoiding
the sensitive SMS permissions that trigger Play Console declarations. Enterprise
(MDM) builds can still enable the full `READ_SMS` flow via a separate manifest
overlay if required.

### Camera & Storage Permissions

#### `CAMERA`

- **Purpose**: Access device camera
- **Required**: Yes (for KYC and receipts)
- **Use Cases**:
  - Capture ID documents for member verification
  - Take photos of payment receipts
  - Scan QR codes for payments
  - Profile picture upload

#### `READ_EXTERNAL_STORAGE` (maxSdkVersion="32")

- **Purpose**: Read files from external storage (Android 12 and below)
- **Required**: Yes
- **Use Cases**:
  - Access existing photos for ID upload
  - Read payment receipts from gallery

#### `WRITE_EXTERNAL_STORAGE` (maxSdkVersion="32")

- **Purpose**: Write files to external storage (Android 12 and below)
- **Required**: Yes
- **Use Cases**:
  - Save payment receipts
  - Export transaction statements

#### `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`

- **Purpose**: Access media files (Android 13+)
- **Required**: Yes
- **Use Cases**:
  - Select images for ID verification
  - Access saved receipts and documents

### Location Permissions

#### `ACCESS_COARSE_LOCATION`

- **Purpose**: Get approximate location
- **Required**: No
- **Use Cases**:
  - Find nearby SACCO branches
  - Location-based fraud detection
  - Show regional services

#### `ACCESS_FINE_LOCATION`

- **Purpose**: Get precise location
- **Required**: No
- **Use Cases**:
  - Accurate branch location for in-person services
  - Enhanced fraud prevention
  - Location-based transaction verification

### Biometric Authentication

#### `USE_BIOMETRIC`

- **Purpose**: Access biometric authentication (Android 9+)
- **Required**: Yes (for secure access)
- **Use Cases**:
  - Fingerprint login
  - Face recognition login
  - Biometric transaction authorization
  - Quick secure access to app

#### `USE_FINGERPRINT`

- **Purpose**: Access fingerprint authentication (legacy)
- **Required**: Yes (for older devices)
- **Use Cases**:
  - Fingerprint login on Android 8 and below

### Notification Permissions

#### `POST_NOTIFICATIONS`

- **Purpose**: Display notifications (Android 13+)
- **Required**: Yes
- **Use Cases**:
  - Transaction alerts
  - Payment reminders
  - Group activity notifications
  - Loan payment due dates

#### `VIBRATE`

- **Purpose**: Vibrate device for feedback
- **Required**: No
- **Use Cases**:
  - Haptic feedback on successful transactions
  - Alert notifications

#### `RECEIVE_BOOT_COMPLETED`

- **Purpose**: Start services after device boot
- **Required**: No
- **Use Cases**:
  - Resume background sync after reboot
  - Restore pending transactions

#### `SCHEDULE_EXACT_ALARM`

- **Purpose**: Schedule precise alarms
- **Required**: No
- **Use Cases**:
  - Payment reminders at specific times
  - Scheduled reports

### Contact Permissions

#### `READ_CONTACTS`

- **Purpose**: Access device contacts
- **Required**: No
- **Use Cases**:
  - Find other SACCO members in contacts
  - Quick member lookup for payments
  - Invite friends to join groups

### Phone & Call Permissions

#### `READ_PHONE_STATE`

- **Purpose**: Read phone status and identity
- **Required**: No
- **Use Cases**:
  - Device identification for security
  - Detect incoming calls during transactions

#### `CALL_PHONE`

- **Purpose**: Initiate phone calls
- **Required**: Yes (for USSD)
- **Use Cases**:
  - USSD dialing for Mobile Money (\*182# in Rwanda)
  - Contact SACCO support
  - Emergency helpline access

### Background Service Permissions

#### `FOREGROUND_SERVICE`

- **Purpose**: Run foreground services
- **Required**: Yes (for sync)
- **Use Cases**:
  - Background data synchronization
  - Process pending transactions
  - Keep app state updated

#### `FOREGROUND_SERVICE_DATA_SYNC`

- **Purpose**: Specify foreground service type (Android 14+)
- **Required**: Yes
- **Use Cases**:
  - Background sync of transaction data
  - Offline-to-online data transfer

#### `WAKE_LOCK`

- **Purpose**: Prevent device from sleeping
- **Required**: Yes (for critical operations)
- **Use Cases**:
  - Complete transactions without interruption
  - Background sync operations

## Hardware Features

All features are marked as `required="false"` to ensure app can be installed on
devices without these features, with graceful fallbacks.

### Camera Features

- `android.hardware.camera`: Basic camera support
- `android.hardware.camera.autofocus`: Auto-focus capability
- `android.hardware.camera.flash`: Camera flash support

### Location Features

- `android.hardware.location`: Location services
- `android.hardware.location.gps`: GPS support
- `android.hardware.location.network`: Network-based location

### Telephony

- `android.hardware.telephony`: Phone capabilities

### Biometric Features

- `android.hardware.fingerprint`: Fingerprint sensor
- `android.hardware.biometric`: Biometric authentication support

## Capacitor Plugins Installed

### Official Capacitor Plugins

1. **@capacitor/app** (7.1.0) - App lifecycle and state management
2. **@capacitor/camera** (7.0.2) - Camera access for photos
3. **@capacitor/device** (7.0.2) - Device information
4. **@capacitor/filesystem** (7.1.4) - File operations
5. **@capacitor/geolocation** (7.1.5) - Location services
6. **@capacitor/haptics** (7.0.2) - Haptic feedback
7. **@capacitor/keyboard** (7.0.3) - Keyboard management
8. **@capacitor/local-notifications** (7.0.3) - Local notifications
9. **@capacitor/network** (7.0.2) - Network status monitoring
10. **@capacitor/push-notifications** (7.0.3) - Push notification support
11. **@capacitor/share** (7.0.2) - Native share functionality
12. **@capacitor/splash-screen** (7.0.3) - Splash screen control
13. **@capacitor/status-bar** (7.0.3) - Status bar customization
14. **@capacitor/toast** (7.0.2) - Toast notifications

### Community Plugins

1. **@capacitor-community/barcode-scanner** (4.0.1) - QR code and barcode
   scanning
2. **@capawesome-team/capacitor-android-foreground-service** (7.0.1) -
   Foreground service management

## Android Dependencies

### Biometric Authentication

- `androidx.biometric:biometric:1.2.0-alpha05`
  - Provides unified biometric API
  - Supports fingerprint, face, and iris recognition

### Background Processing

- `androidx.work:work-runtime:2.9.1`
- `androidx.work:work-runtime-ktx:2.9.1`
  - WorkManager for reliable background tasks
  - Handles offline-to-online sync
  - Schedules periodic data updates

### Google Play Services

- `com.google.android.gms:play-services-location:21.3.0`
  - Enhanced location services
  - Geofencing support
- `com.google.android.gms:play-services-maps:19.0.0`
  - Maps integration for branch locations

### Camera

- `androidx.camera:camera-camera2:1.4.1`
- `androidx.camera:camera-lifecycle:1.4.1`
- `androidx.camera:camera-view:1.4.1`
  - CameraX for modern camera implementation
  - Better image quality and performance

### UI Components

- `com.google.android.material:material:1.12.0`
  - Material Design components
  - Modern, accessible UI elements

## Services and Broadcast Receivers

### Foreground Service

- **Name**:
  `com.capawesome.capacitorjs.plugins.foregroundservice.ForegroundService`
- **Type**: dataSync
- **Purpose**: Run background data synchronization tasks
- **Use Cases**:
  - Sync offline transactions when network is available
  - Update transaction statuses
  - Process pending payments

### Boot Receiver

- **Name**: `.BootReceiver`
- **Purpose**: Restart services after device reboot
- **Use Cases**:
  - Resume background sync
  - Restore notification channels
  - Check for pending transactions

## Security Considerations

### Permission Requesting

- All dangerous permissions are requested at runtime
- Users can deny permissions and the app should gracefully handle it
- Permissions are explained to users before requesting

### SMS Permissions Security

- SMS permissions are highly sensitive
- Only used for finance-related operations
- Messages are not logged or shared
- OTP codes are extracted and immediately cleared from memory

### Location Privacy

- Location is only accessed when needed
- Users can deny location and still use core features
- Location data is not stored long-term

### Biometric Security

- Biometric data never leaves the device
- Android Keystore used for secure key storage
- Fallback to PIN/password if biometric fails

## Testing Checklist

- [ ] Test SMS OTP reading with various Mobile Money providers
- [ ] Verify camera permissions for ID upload
- [ ] Test biometric authentication on multiple devices
- [ ] Verify push notifications delivery
- [ ] Test offline mode and background sync
- [ ] Verify USSD dialing functionality
- [ ] Test location-based features (branch finder)
- [ ] Verify QR code scanning for payments
- [ ] Test on Android versions 9-14
- [ ] Verify permission request flows
- [ ] Test graceful degradation when permissions denied

## Future Enhancements

- **NFC Support**: For contactless payments
- **Bluetooth**: For proximity-based features
- **Calendar**: For scheduling SACCO meetings
- **Health Connect**: For insurance integration (if applicable)
- **Digital Signatures**: For document signing

## Compliance Notes

### Google Play Store Requirements

- Privacy policy must clearly explain all permission usage
- SMS and CALL_LOG permissions require special declaration
- Must provide video demo of core functionality using SMS

### Rwanda Regulations

- KYC data must be stored securely and encrypted
- Transaction logs must be maintained per financial regulations
- Data retention policies must comply with local laws

## Support and Troubleshooting

### Common Issues

**Permission Denied Errors**

- Check if user denied permission
- Show explanatory dialog
- Redirect to app settings if needed

**SMS Reading Not Working**

- Verify SMS permission granted
- Check if default SMS app is interfering
- Ensure SMS format matches expected pattern

**Biometric Not Available**

- Check if device has biometric hardware
- Verify user has enrolled biometrics
- Provide fallback to PIN/password

**Camera Issues**

- Check camera permission
- Verify camera is not in use by another app
- Handle low-light conditions gracefully

## References

- [Android Permissions Documentation](https://developer.android.com/guide/topics/permissions/overview)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Biometric Guide](https://developer.android.com/training/sign-in/biometric-auth)
- [WorkManager Documentation](https://developer.android.com/topic/libraries/architecture/workmanager)
