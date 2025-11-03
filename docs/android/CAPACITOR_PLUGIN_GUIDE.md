# Capacitor Plugin Development Guide

This guide covers best practices for developing native plugins for the Ibimina Capacitor-based Android apps.

## Overview

The Ibimina admin and client apps use Capacitor to wrap Next.js web applications with native Android capabilities. This hybrid approach provides:

- **Code reuse**: Single codebase for web and mobile  
- **Native access**: Custom plugins for device features
- **Fast iteration**: Hot reload during development
- **Production-ready**: Full native app capabilities

## Architecture

```
┌─────────────────────────────────────┐
│     Next.js Web Application          │
│  (TypeScript, React, Tailwind)       │
└──────────────┬──────────────────────┘
               │ Capacitor Bridge
┌──────────────▼──────────────────────┐
│      Capacitor Core Runtime          │
│  (JavaScript ↔ Native Bridge)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Native Android Plugins          │
│  (Kotlin, Device APIs, Background)   │
└──────────────────────────────────────┘
```

## Existing Plugins

### 1. DeviceAuth Plugin

**Location**: `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/DeviceAuthPlugin.kt`

**Purpose**: Biometric authentication and device-bound cryptographic keys

**Capabilities**:
- Check biometric availability
- Generate device-specific keypairs in Android Keystore
- Sign authentication challenges with biometric unlock
- Manage device credentials securely

**Usage Example**:
```typescript
import { DeviceAuth } from './plugins/device-auth';

// Check if biometrics are available
const { available } = await DeviceAuth.checkBiometricAvailable();

// Generate a device key
const { deviceId, publicKey } = await DeviceAuth.generateDeviceKey({
  userId: 'user-123',
  requireBiometric: true
});

// Sign a challenge
const { signature } = await DeviceAuth.signChallenge({
  challenge: challengeJson,
  userId: 'user-123',
  origin: 'ibimina.rw'
});
```

### 2. SmsIngest Plugin

**Location**: `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt`

**Purpose**: Parse mobile money transaction SMS for reconciliation

**Capabilities**:
- Real-time SMS monitoring via BroadcastReceiver
- Parse MTN Mobile Money, Airtel Money, Tigo Cash formats
- Extract transaction details (amount, reference, sender)
- Queue transactions for background sync

**Components**:
- `SmsReceiver.kt`: BroadcastReceiver for SMS_RECEIVED
- `SmsSyncWorker.kt`: WorkManager for background sync
- `SmsIngestPlugin.kt`: Capacitor plugin bridge

## Creating a New Plugin

### Step 1: Plugin Class

Create a Kotlin file in `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/`:

```kotlin
package rw.ibimina.staff.plugins

import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject

@CapacitorPlugin(name = "MyFeature")
class MyFeaturePlugin : Plugin() {
    
    override fun load() {
        super.load()
        // Initialize plugin
    }
    
    @PluginMethod
    fun myMethod(call: PluginCall) {
        val param = call.getString("param")
        
        if (param.isNullOrBlank()) {
            call.reject("param is required")
            return
        }
        
        try {
            // Do work
            val result = JSObject()
            result.put("success", true)
            result.put("data", "some value")
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Operation failed: ${e.message}")
        }
    }
}
```

### Step 2: Register Plugin

Add to `MainActivity.java`:

```java
import rw.ibimina.staff.plugins.MyFeaturePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        registerPlugin(DeviceAuthPlugin.class);
        registerPlugin(SmsIngestPlugin.class);
        registerPlugin(MyFeaturePlugin.class); // Add here
    }
}
```

### Step 3: TypeScript Bridge

Create `lib/plugins/my-feature.ts`:

```typescript
import { registerPlugin } from '@capacitor/core';

export interface MyFeaturePlugin {
  myMethod(options: { param: string }): Promise<{ success: boolean; data: string }>;
}

const MyFeature = registerPlugin<MyFeaturePlugin>('MyFeature', {
  web: () => import('./my-feature-web').then(m => new m.MyFeatureWeb()),
});

export default MyFeature;
```

### Step 4: Web Fallback

Create `lib/plugins/my-feature-web.ts`:

```typescript
import { WebPlugin } from '@capacitor/core';
import type { MyFeaturePlugin } from './my-feature';

export class MyFeatureWeb extends WebPlugin implements MyFeaturePlugin {
  async myMethod(options: { param: string }): Promise<{ success: boolean; data: string }> {
    console.log('MyFeature web fallback called', options);
    // Provide web-compatible implementation or throw
    throw new Error('MyFeature not supported on web');
  }
}
```

## Best Practices

For detailed best practices, see the complete guide in this file.

## Resources

- [Capacitor Plugin Guide](https://capacitorjs.com/docs/plugins)
- [Android Developer Docs](https://developer.android.com/docs)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)
- [WorkManager Guide](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Android Keystore](https://developer.android.com/training/articles/keystore)
