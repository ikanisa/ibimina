# TapMoMo Integration Guide

This guide shows how to integrate the TapMoMo library into the existing Ibimina
client app.

## Integration Steps for apps/client

### 1. Module Already Included

The module is already included in `apps/client/android/settings.gradle`:

```groovy
include ':feature-tapmomo'
project(':feature-tapmomo').projectDir = new File('../../../feature-tapmomo/')
```

### 2. Add Dependency

In `apps/client/android/app/build.gradle`, add:

```groovy
dependencies {
    // ... existing dependencies

    // TapMoMo NFC payment library
    implementation project(':feature-tapmomo')
}
```

### 3. Initialize in Application

In your Application class (or MainActivity if no custom Application):

```kotlin
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.TapMoMoConfig
import com.tapmomo.feature.Network

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize TapMoMo once
        TapMoMo.init(
            context = applicationContext,
            config = TapMoMoConfig(
                supabaseUrl = System.getenv("SUPABASE_URL"),
                supabaseAnonKey = System.getenv("SUPABASE_ANON_KEY"),
                reconcileFunctionUrl = System.getenv("RECONCILE_FN_URL"),
                defaultCurrency = "RWF",
                networks = setOf(Network.MTN, Network.Airtel),
                hceTtlMs = 45_000,
                requireSignature = true,
                allowUnsignedWithWarning = true,
                useUssdShortcutWhenAmountPresent = true
            )
        )
    }
}
```

### 4. Launch Payment Flows

#### From Capacitor/JavaScript Bridge

Add a Capacitor plugin to expose TapMoMo to your web layer:

```kotlin
@CapacitorPlugin(name = "TapMoMoPlugin")
class TapMoMoPlugin : Plugin() {

    @PluginMethod
    fun openGetPaid(call: PluginCall) {
        val amount = call.getInt("amount")
        val networkName = call.getString("network", "MTN")
        val merchantId = call.getString("merchantId", "")

        val network = try {
            Network.valueOf(networkName)
        } catch (e: Exception) {
            Network.MTN
        }

        activity.runOnUiThread {
            TapMoMo.openGetPaid(
                context = activity,
                amount = amount,
                network = network,
                merchantId = merchantId
            )
        }

        call.resolve()
    }

    @PluginMethod
    fun openPay(call: PluginCall) {
        activity.runOnUiThread {
            TapMoMo.openPay(activity)
        }
        call.resolve()
    }

    @PluginMethod
    fun isNfcAvailable(call: PluginCall) {
        val available = TapMoMo.isNfcAvailable(activity)
        val enabled = TapMoMo.isNfcEnabled(activity)

        val result = JSObject()
        result.put("available", available)
        result.put("enabled", enabled)

        call.resolve(result)
    }
}
```

Register the plugin in MainActivity:

```kotlin
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        registerPlugin(TapMoMoPlugin::class.java)
    }
}
```

#### From TypeScript/JavaScript

```typescript
import { Plugins } from "@capacitor/core";

const { TapMoMoPlugin } = Plugins;

// Check NFC availability
async function checkNfc() {
  const result = await TapMoMoPlugin.isNfcAvailable();
  console.log("NFC available:", result.available);
  console.log("NFC enabled:", result.enabled);
}

// Launch "Get Paid" screen
async function startReceiving() {
  await TapMoMoPlugin.openGetPaid({
    amount: 2500,
    network: "MTN",
    merchantId: "123456",
  });
}

// Launch "Pay" screen
async function startPaying() {
  await TapMoMoPlugin.openPay();
}
```

### 5. UI Integration Examples

#### Add Payment Button to React Component

```tsx
import React from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { nfcOutline } from "ionicons/icons";

const PaymentButton: React.FC = () => {
  const handleTapToPay = async () => {
    // Check NFC first
    const nfc = await TapMoMoPlugin.isNfcAvailable();
    if (!nfc.available) {
      alert("NFC not available on this device");
      return;
    }
    if (!nfc.enabled) {
      alert("Please enable NFC in device settings");
      return;
    }

    // Launch payment screen
    await TapMoMoPlugin.openPay();
  };

  const handleReceivePayment = async () => {
    await TapMoMoPlugin.openGetPaid({
      amount: 5000, // Optional
      network: "MTN",
      merchantId: "123456",
    });
  };

  return (
    <div>
      <IonButton onClick={handleTapToPay}>
        <IonIcon icon={nfcOutline} slot="start" />
        Tap to Pay
      </IonButton>

      <IonButton onClick={handleReceivePayment} color="success">
        <IonIcon icon={nfcOutline} slot="start" />
        Receive Payment
      </IonButton>
    </div>
  );
};

export default PaymentButton;
```

### 6. Build and Test

Build the Android app:

```bash
cd apps/client/android
./gradlew assembleDebug
```

Install on device:

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Test NFC:

1. Ensure device has NFC enabled
2. Test "Get Paid" flow on one device
3. Test "Pay" flow on another device
4. Tap devices together when NFC is active

## Environment Variables

Set these in your build environment:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export RECONCILE_FN_URL="https://your-project.supabase.co/functions/v1/reconcile"
```

Or add to `apps/client/android/local.properties`:

```properties
supabaseUrl=https://your-project.supabase.co
supabaseAnonKey=your-anon-key
reconcileFnUrl=https://your-project.supabase.co/functions/v1/reconcile
```

Then reference in build.gradle:

```groovy
def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

android {
    defaultConfig {
        buildConfigField "String", "SUPABASE_URL", "\"${localProperties.getProperty('supabaseUrl')}\""
        buildConfigField "String", "SUPABASE_ANON_KEY", "\"${localProperties.getProperty('supabaseAnonKey')}\""
        buildConfigField "String", "RECONCILE_FN_URL", "\"${localProperties.getProperty('reconcileFnUrl')}\""
    }
}
```

## Troubleshooting

### NFC Not Working

1. Check device has NFC hardware: `TapMoMo.isNfcAvailable()`
2. Ensure NFC is enabled in device settings
3. Check HCE service is registered in manifest
4. Verify AID is not conflicting with other apps

### USSD Not Launching

1. Check CALL_PHONE permission is granted
2. Verify SIM card is inserted and active
3. Test with different USSD codes manually
4. Check device Android version (API 26+ for sendUssdRequest)

### Build Errors

1. Ensure Kotlin version matches (1.9.20+)
2. Sync Gradle files
3. Clean and rebuild: `./gradlew clean assembleDebug`
4. Check KSP plugin version matches Kotlin version

### Permission Errors

The library handles permissions automatically, but you can request them
manually:

```kotlin
import android.Manifest
import androidx.core.app.ActivityCompat

val permissions = arrayOf(
    Manifest.permission.CALL_PHONE,
    Manifest.permission.READ_PHONE_STATE
)

ActivityCompat.requestPermissions(this, permissions, REQUEST_CODE)
```

## Best Practices

1. **Initialize once** in Application.onCreate()
2. **Check NFC availability** before showing payment options
3. **Handle permissions** gracefully with explanations
4. **Test on real devices** with NFC hardware
5. **Use signed builds** for signature verification in production
6. **Implement error handling** for USSD failures
7. **Provide fallback options** (QR codes, manual entry)

## Next Steps

1. Set up Supabase backend (see `backend/README.md`)
2. Generate merchant signing keys
3. Configure USSD templates for your country/network
4. Test end-to-end payment flow
5. Implement transaction history UI
6. Add analytics and monitoring

## Support

For integration help:

- Check main README.md for library documentation
- Review example code in this guide
- Test with included sample screens
- Open issues for bugs or feature requests
