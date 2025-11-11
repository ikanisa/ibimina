# Capacitor Decommissioning Pre-Refactor Report

## Branch Preparation

- Created local `main` branch from existing `work` head.
- Attempted to pull latest `main`, but no upstream tracking branch is configured
  in this environment.
- Created `pre-refactor-backup` from local `main` for staging refactor work.
- `git push -u origin pre-refactor-backup` failed because no `origin` remote is
  defined; manual push will be required once remote access is configured.

## Known Capacitor Build Issues and Affected Commands

- **iOS build fails with “Module 'Capacitor' not found”**: resolve by syncing
  native project assets (`npx cap sync ios`).
- **iOS build script errors (`Command PhaseScriptExecution failed`)**: clean
  CocoaPods artifacts and reinstall
  (`rm -rf ios/App/Pods ios/App/Podfile.lock && pod install`).
- **iOS signing error (“Signing for App requires a development team”)**: assign
  a valid team inside Xcode’s Signing & Capabilities pane.
- **Post-build launch crashes**: ensure web assets are rebuilt (`pnpm build`)
  and native project is resynced (`npx cap sync ios`).
- **Android release packaging**: custom script
  `apps/client/build-android-aab.sh` synchronizes Capacitor assets and removes
  problematic `@capacitor/push-notifications` dependency before building.

## Repository Search Results

### `rg -n --heading "capacitor"`

<details>
<summary>Full command output</summary>

```text
NATIVE_REFACTORING_PLAN.md
651:rm -rf capacitor.config.ts
652:rm -rf capacitor.config.json
657:npm uninstall @capacitor/core \
658:              @capacitor/cli \
659:              @capacitor/ios \
660:              @capacitor/android \
661:              @capacitor/app \
662:              @capacitor/haptics \
663:              @capacitor/keyboard \
664:              @capacitor/status-bar \
665:              @capacitor/camera \
666:              @capacitor/filesystem \
667:              @capacitor/geolocation \
668:              @capacitor/push-notifications \
669:              @capacitor/share \
670:              @capacitor/splash-screen
679:find src/components -name "*capacitor*" -type f -delete

DELIVERY_PACKAGE_README.md
58:**scripts/fix-capacitor-android.sh**

docs/TAPMOMO_QUICK_START.md
143:import TapMoMo from "@/lib/capacitor/tapmomo";
171:import TapMoMo from "@/lib/capacitor/tapmomo";

pnpm-lock.yaml
11:      '@capacitor/android':
13:        version: 7.4.4(@capacitor/core@7.4.4)
14:      '@capacitor/core':
27:      '@capacitor/cli':
96:      '@capacitor/android':
98:        version: 7.4.4(@capacitor/core@7.4.4)
99:      '@capacitor/app':
101:        version: 7.1.0(@capacitor/core@7.4.4)
102:      '@capacitor/camera':
104:        version: 7.0.2(@capacitor/core@7.4.4)
105:      '@capacitor/cli':
108:      '@capacitor/core':
111:      '@capacitor/device':
113:        version: 7.0.2(@capacitor/core@7.4.4)
114:      '@capacitor/haptics':
116:        version: 7.0.2(@capacitor/core@7.4.4)
117:      '@capacitor/preferences':
119:        version: 7.0.2(@capacitor/core@7.4.4)
274:      '@capacitor-community/barcode-scanner':
276:        version: 4.0.1(@capacitor/core@7.4.4)
277:      '@capacitor/android':
279:        version: 7.4.4(@capacitor/core@7.4.4)
280:      '@capacitor/app':
282:        version: 7.1.0(@capacitor/core@7.4.4)
283:      '@capacitor/camera':
285:        version: 7.0.2(@capacitor/core@7.4.4)
286:      '@capacitor/cli':
289:      '@capacitor/core':
292:      '@capacitor/device':
294:        version: 7.0.2(@capacitor/core@7.4.4)
295:      '@capacitor/filesystem':
297:        version: 7.1.4(@capacitor/core@7.4.4)
298:      '@capacitor/geolocation':
300:        version: 7.1.5(@capacitor/core@7.4.4)
301:      '@capacitor/haptics':
303:        version: 7.0.2(@capacitor/core@7.4.4)
304:      '@capacitor/ios':
306:        version: 7.4.4(@capacitor/core@7.4.4)
307:      '@capacitor/keyboard':
309:        version: 7.0.3(@capacitor/core@7.4.4)
310:      '@capacitor/local-notifications':
312:        version: 7.0.3(@capacitor/core@7.4.4)
313:      '@capacitor/network':
315:        version: 7.0.2(@capacitor/core@7.4.4)
316:      '@capacitor/share':
318:        version: 7.0.2(@capacitor/core@7.4.4)
319:      '@capacitor/splash-screen':
321:        version: 7.0.3(@capacitor/core@7.4.4)
322:      '@capacitor/status-bar':
324:        version: 7.0.3(@capacitor/core@7.4.4)
325:      '@capacitor/toast':
327:        version: 7.0.2(@capacitor/core@7.4.4)
328:      '@capawesome-team/capacitor-android-foreground-service':
330:        version: 7.0.1(@capacitor/core@7.4.4)
1428:  '@capacitor-community/barcode-scanner@4.0.1':
1431:      '@capacitor/core': ^5.0.0
1433:  '@capacitor/android@7.4.4':
1436:      '@capacitor/core': ^7.4.0
1438:  '@capacitor/app@7.1.0':
1441:      '@capacitor/core': '>=7.0.0'
1443:  '@capacitor/camera@7.0.2':
1446:      '@capacitor/core': '>=7.0.0'
1448:  '@capacitor/cli@7.4.4':
1453:  '@capacitor/core@7.4.4':
1456:  '@capacitor/device@7.0.2':
1459:      '@capacitor/core': '>=7.0.0'
1461:  '@capacitor/filesystem@7.1.4':
1464:      '@capacitor/core': '>=7.0.0'
1466:  '@capacitor/geolocation@7.1.5':
1469:      '@capacitor/core': '>=7.0.0'
1471:  '@capacitor/haptics@7.0.2':
1474:      '@capacitor/core': '>=7.0.0'
1476:  '@capacitor/ios@7.4.4':
1479:      '@capacitor/core': ^7.4.0
1481:  '@capacitor/keyboard@7.0.3':
1484:      '@capacitor/core': '>=7.0.0'
1486:  '@capacitor/local-notifications@7.0.3':
1489:      '@capacitor/core': '>=7.0.0'
1491:  '@capacitor/network@7.0.2':
1494:      '@capacitor/core': '>=7.0.0'
1496:  '@capacitor/preferences@7.0.2':
1499:      '@capacitor/core': '>=7.0.0'
1501:  '@capacitor/share@7.0.2':
1504:      '@capacitor/core': '>=7.0.0'
1506:  '@capacitor/splash-screen@7.0.3':
1509:      '@capacitor/core': '>=7.0.0'
1511:  '@capacitor/status-bar@7.0.3':
1514:      '@capacitor/core': '>=7.0.0'
1516:  '@capacitor/synapse@1.0.4':
1519:  '@capacitor/toast@7.0.2':
1522:      '@capacitor/core': '>=7.0.0'
1524:  '@capawesome-team/capacitor-android-foreground-service@7.0.1':
1527:      '@capacitor/core': '>=7.0.0'
10320:  '@capacitor-community/barcode-scanner@4.0.1(@capacitor/core@7.4.4)':
10322:      '@capacitor/core': 7.4.4
10326:  '@capacitor/android@7.4.4(@capacitor/core@7.4.4)':
10328:      '@capacitor/core': 7.4.4
10330:  '@capacitor/app@7.1.0(@capacitor/core@7.4.4)':
10332:      '@capacitor/core': 7.4.4
10334:  '@capacitor/camera@7.0.2(@capacitor/core@7.4.4)':
10336:      '@capacitor/core': 7.4.4
10338:  '@capacitor/cli@7.4.4':
10360:  '@capacitor/core@7.4.4':
10364:  '@capacitor/device@7.0.2(@capacitor/core@7.4.4)':
10366:      '@capacitor/core': 7.4.4
10368:  '@capacitor/filesystem@7.1.4(@capacitor/core@7.4.4)':
10370:      '@capacitor/core': 7.4.4
10371:      '@capacitor/synapse': 1.0.4
10373:  '@capacitor/geolocation@7.1.5(@capacitor/core@7.4.4)':
10375:      '@capacitor/core': 7.4.4
10376:      '@capacitor/synapse': 1.0.4
10378:  '@capacitor/haptics@7.0.2(@capacitor/core@7.4.4)':
10380:      '@capacitor/core': 7.4.4
10382:  '@capacitor/ios@7.4.4(@capacitor/core@7.4.4)':
10384:      '@capacitor/core': 7.4.4
10386:  '@capacitor/keyboard@7.0.3(@capacitor/core@7.4.4)':
10388:      '@capacitor/core': 7.4.4
10390:  '@capacitor/local-notifications@7.0.3(@capacitor/core@7.4.4)':
10392:      '@capacitor/core': 7.4.4
10394:  '@capacitor/network@7.0.2(@capacitor/core@7.4.4)':
10396:      '@capacitor/core': 7.4.4
10398:  '@capacitor/preferences@7.0.2(@capacitor/core@7.4.4)':
10400:      '@capacitor/core': 7.4.4
10402:  '@capacitor/share@7.0.2(@capacitor/core@7.4.4)':
10404:      '@capacitor/core': 7.4.4
10406:  '@capacitor/splash-screen@7.0.3(@capacitor/core@7.4.4)':
10408:      '@capacitor/core': 7.4.4
10410:  '@capacitor/status-bar@7.0.3(@capacitor/core@7.4.4)':
10412:      '@capacitor/core': 7.4.4
10414:  '@capacitor/synapse@1.0.4': {}
10416:  '@capacitor/toast@7.0.2(@capacitor/core@7.4.4)':
10418:      '@capacitor/core': 7.4.4
10420:  '@capawesome-team/capacitor-android-foreground-service@7.0.1(@capacitor/core@7.4.4)':
10422:      '@capacitor/core': 7.4.4

docs/TAPMOMO_GUIDE.md
313:import { Plugins } from "@capacitor/core";

docs/2FA_QR_AUTHENTICATION.md
532:import { NativeBiometric } from "@capgo/capacitor-native-biometric";
563:- [Capacitor Barcode Scanner](https://capacitorjs.com/docs/apis/barcode-scanner)
564:- [Capacitor Biometric](https://github.com/Cap-go/capacitor-native-biometric)

docs/IOS_APP_SETUP_GUIDE.md
18:- Capacitor configuration (`apps/client/capacitor.config.ts`)
128:│   │   │   └── capacitor.config.json
134:├── capacitor.config.ts            # Capacitor configuration
194:# Terminal 2: Update capacitor.config.ts
355:2. Verify `capacitor.config.ts` is correct
395:import { BiometricAuth } from '@capacitor/biometric-auth';
415:Configure push in `capacitor.config.ts`:
430:import { PushNotifications } from '@capacitor/push-notifications';
522:- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
533:- Review Capacitor iOS issues: https://github.com/ionic-team/capacitor/issues

docs/2FA_IMPLEMENTATION_STATUS.md
144:- `@capacitor-community/barcode-scanner` - QR code scanning
145:- `@capgo/capacitor-native-biometric` - Biometric authentication
403:import { NativeBiometric } from '@capgo/capacitor-native-biometric';

docs/2FA_QUICK_START.md
35:pnpm add @capacitor-community/barcode-scanner @capgo/capacitor-native-biometric

docs/operations/app-portfolio-status.md
14:  `apps/admin` (`capacitor` folder). All device-auth milestones tracked in

docs/android/CAPACITOR_PLUGIN_GUIDE.md
94:import com.getcapacitor.*
95:import com.getcapacitor.annotation.CapacitorPlugin
152:import { registerPlugin } from '@capacitor/core';
170:import { WebPlugin } from '@capacitor/core';
188:- [Capacitor Plugin Guide](https://capacitorjs.com/docs/plugins)

docs/android/PERFORMANCE_OPTIMIZATION.md
135:-keep class com.getcapacitor.** { *; }
136:-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
602:- [Capacitor Performance](https://capacitorjs.com/docs/guides/performance)

docs/android/QUICKSTART.md
106:# Edit capacitor.config.ts - url: 'http://10.0.2.2:3100'
223:// capacitor.config.ts
236:3. Verify URL in capacitor.config.ts
249:- [Capacitor Docs](https://capacitorjs.com/docs)

docs/android/README.md
285:Check Capacitor server configuration in capacitor.config.ts and ensure CORS is properly configured on the backend.
325:- [Capacitor Documentation](https://capacitorjs.com/docs)

docs/2FA_COMPLETE_REPORT.md
261:   - `@capacitor-community/barcode-scanner` (QR scanning)
262:   - `@capgo/capacitor-native-biometric` (biometric auth)

docs/TAPMOMO_NFC_IMPLEMENTATION.md
204:Located: `apps/admin/lib/capacitor/tapmomo.ts`
207:import TapMoMo from "@/lib/capacitor/tapmomo";

DEEP_FULLSTACK_AUDIT_REPORT.md
480:├── capacitor.config.ts         ⚠️ Has Replit URL
993:3. Update `capacitor.config.ts` URL (5 minutes)
1103:   - [ ] Update `capacitor.config.ts` production URL (5 minutes)

ANDROID_BUILD_SUCCESS.md
31:**Problem:** `Could not find com.capacitorjs:capacitor-bom:7.4.4`
36:    implementation project(':capacitor-android')
37:    implementation project(':capacitor-cordova-android-plugins')

MOBILE_APK_PRODUCTION_ROADMAP.md
550:pnpm install  # Installs @capacitor/cli

feature-tapmomo/INTEGRATION_GUIDE.md
133:import { Plugins } from "@capacitor/core";

attached_assets/Pasted-jeanbosco-Jeans-MacBook-Pro-ibimina-cd-Users-jeanbosco-workspace-ibimina-apps-admin-pnpm-add-qrco-1761952266285_1761952266287.txt
25:└─┬ @capacitor-community/barcode-scanner 4.0.1
26:  ├── ✕ unmet peer @capacitor/core@^5.0.0: found 7.4.4

DEPLOYMENT_STATUS.md
93:- `capacitor-bom:5.7.4` not found (should use 7.x)

BUILD_ANDROID.md
575:// apps/admin/capacitor.config.ts

DEEP_FULLSTACK_PRODUCTION_AUDIT.md
889:- `apps/client/capacitor.config.ts` - Capacitor native config

FIX_SUMMARY.md
64:✅ @capacitor/cli 7.4.4

scripts/fix-capacitor-android.sh
15:CAPACITOR_FILE=$(find "$PROJECT_ROOT/node_modules" -name "CapacitorWebView.java" -path "*@capacitor/android*" | head -1)

apps/admin/ANDROID_BUILD_FIXED.md
29:**Error**: `Could not find com.capacitorjs:capacitor-bom:5.7.4`

apps/admin/lib/plugins/network-monitor.ts
1:import { registerPlugin } from "@capacitor/core";
2:import type { PluginListenerHandle } from "@capacitor/core";

apps/admin/lib/plugins/enhanced-notifications.ts
1:import { registerPlugin } from "@capacitor/core";

apps/admin/lib/native/pin-auth.ts
31:import { Capacitor, registerPlugin } from "@capacitor/core";

apps/admin/lib/native/device-auth.ts
28:import { Capacitor, registerPlugin } from "@capacitor/core";

apps/admin/lib/native/sms-ingest.ts
35:import { Capacitor, registerPlugin } from "@capacitor/core";

apps/admin/lib/capacitor/tapmomo.ts
1:import { registerPlugin } from "@capacitor/core";

apps/admin/ANDROID_SMS_IMPLEMENTATION.md
73:pnpm add @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/push-notifications @capacitor/device @capacitor/haptics @capacitor/preferences @capacitor/app
78:The `capacitor.config.ts` file is already configured:
282:2. Update `capacitor.config.ts` to point to localhost:

QUICK_ACTION_PLAN_24H.md
65:    implementation(platform("com.capacitorjs:capacitor-bom:7.4.4"))
66:    implementation("com.getcapacitor:core")
67:    implementation("com.getcapacitor:android")
620:adb logcat | grep -i "ibimina\|tapmomo\|capacitor"

TAPMOMO_COMPLETE_SUMMARY.md
75:**Location:** `apps/admin/lib/capacitor/tapmomo.ts`
393:11. `apps/admin/lib/capacitor/tapmomo.ts`

package.json
63:    "@capacitor/android": "^7.4.4",
64:    "@capacitor/core": "^7.4.4",
70:    "@capacitor/cli": "^7.4.4",

apps/admin/ANDROID_BUILD_FIXES.md
24:- **Error**: `Could not find com.capacitorjs:capacitor-bom:5.7.4`
42:- **Fix**: Added `import com.getcapacitor.annotation.PermissionCallback`
100:        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
108:import com.getcapacitor.annotation.PermissionCallback
129:import com.getcapacitor.annotation.PermissionCallback
267:- [Capacitor 7 Android Requirements](https://capacitorjs.com/docs/android)

apps/admin/FIREBASE_CLEANUP_SUMMARY.md
47:"@capacitor/push-notifications": "^7.0.3"
64:# Search results: 0 imports of @capacitor/push-notifications
143:   - Add `@capacitor/push-notifications` to `package.json`

apps/admin/BUILD_APK_INSTRUCTIONS.md
61:1. Edit `apps/admin/capacitor.config.ts`

apps/admin/STAFF_MOBILE_APP_README.md
20:- ✅ **@capacitor/app** (7.1.0) - App lifecycle events
21:- ✅ **@capacitor/camera** (7.0.2) - Camera access for ID uploads
22:- ✅ **@capacitor/device** (7.0.2) - Device information
23:- ✅ **@capacitor/haptics** (7.0.2) - Haptic feedback
24:- ✅ **@capacitor/preferences** (7.0.2) - Secure local storage
25:- ✅ **@capacitor/push-notifications** (7.0.3) - Push notifications
100:├── capacitor.config.ts       # Capacitor configuration
111:1. **Edit `capacitor.config.ts`:**
158:- ✅ Certificate pinning ready (configure in capacitor.config.ts)
208:- See Capacitor docs: https://capacitorjs.com/docs/android

apps/admin/android/capacitor.settings.gradle
1:// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN
2:include ':capacitor-android'
3:project(':capacitor-android').projectDir = new File('../../../node_modules/.pnpm/@capacitor+android@7.4.4_@capacitor+core@7.4.4/node_modules/@capacitor/android/capacitor')
5:include ':capacitor-app'
6:project(':capacitor-app').projectDir = new File('../../../node_modules/.pnpm/@capacitor+app@7.1.0_@capacitor+core@7.4.4/node_modules/@capacitor/app/android')
8:include ':capacitor-camera'
9:project(':capacitor-camera').projectDir = new File('../../../node_modules/.pnpm/@capacitor+camera@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/camera/android')
11:include ':capacitor-device'
12:project(':capacitor-device').projectDir = new File('../../../node_modules/.pnpm/@capacitor+device@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/device/android')
14:include ':capacitor-haptics'
15:project(':capacitor-haptics').projectDir = new File('../../../node_modules/.pnpm/@capacitor+haptics@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/haptics/android')
17:include ':capacitor-preferences'
18:project(':capacitor-preferences').projectDir = new File('../../../node_modules/.pnpm/@capacitor+preferences@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/preferences/android')
20:include ':capacitor-push-notifications'
21:project(':capacitor-push-notifications').projectDir = new File('../../../node_modules/.pnpm/@capacitor+push-notifications@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/push-notifications/android')

apps/admin/android/BUILD_FIX_SUMMARY.md
56:**Solution:** Created `capacitor.config.js` as JavaScript version:

apps/admin/android/ANDROID_BUILD_FIX.md
180:   rm -rf .gradle build app/build capacitor-*/build
187:   pnpm update @capacitor/android @capacitor/core
226:- [Capacitor 7 Migration Guide](https://capacitorjs.com/docs/updating/7-0)

apps/admin/android/settings.gradle
2:include ':capacitor-cordova-android-plugins'
3:project(':capacitor-cordova-android-plugins').projectDir = new File('./capacitor-cordova-android-plugins/')
5:apply from: 'capacitor.settings.gradle'

apps/admin/android/capacitor-cordova-android-plugins/build.gradle
19:    namespace "capacitor.cordova.android.plugins"

apps/admin/android/capacitor-cordova-android-plugins/cordova.variables.gradle
1:// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN

app/mobile/types/custom/capacitor-clipboard.d.ts
1:declare module "@capacitor/clipboard" {

app/mobile/types/custom/index.d.ts
2:/// <reference path="./capacitor-core.d.ts" />
3:/// <reference path="./capacitor-haptics.d.ts" />
4:/// <reference path="./capacitor-clipboard.d.ts" />

app/mobile/types/custom/capacitor-haptics.d.ts
1:declare module "@capacitor/haptics" {

app/mobile/types/custom/capacitor-core.d.ts
1:declare module "@capacitor/core" {

app/mobile/src/utils/native.ts
1:import { Capacitor } from "@capacitor/core";
2:import { Haptics, ImpactStyle } from "@capacitor/haptics";
20:      const plugin = (await import("@capacitor/clipboard").catch(() => null)) as {

app/mobile/src/screens/ProfileScreen.tsx
12:import { ImpactStyle } from "@capacitor/haptics";

app/mobile/src/screens/PayScreen.tsx
11:import { ImpactStyle } from "@capacitor/haptics";

app/mobile/tsconfig.json
14:      "@capacitor/core": ["../types/custom/capacitor-core"],
15:      "@capacitor/haptics": ["../types/custom/capacitor-haptics"],
16:      "@capacitor/clipboard": ["../types/custom/capacitor-clipboard"]

REFACTORING_PLAN.md
71:    "@capacitor/core",
72:    "@capacitor/ios",
73:    "@capacitor/android",
74:    "@capacitor/app",
75:    "@capacitor/haptics",
76:    "@capacitor/keyboard",
77:    "@capacitor/status-bar",
78:    "@capacitor/camera",
79:    "@capacitor/filesystem",
80:    "@capacitor/geolocation",
81:    "@capacitor/push-notifications",
82:    "@capacitor/share",
83:    "@capacitor/splash-screen",
94:/capacitor.config.ts
97:/capacitor.config.json
328:npm uninstall @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
329:rm -rf ios android capacitor.config.*

apps/client/lib/utils/permissions.ts
8:import { Device } from "@capacitor/device";
9:import { Toast } from "@capacitor/toast";

apps/client/lib/sms/user-consent.ts
1:import { Capacitor, registerPlugin } from "@capacitor/core";

apps/client/lib/device-auth/manager.ts
7:import { Capacitor } from "@capacitor/core";

apps/client/lib/deep-links/handler.ts
18:import { App, URLOpenListenerEvent } from "@capacitor/app";
19:import { Capacitor } from "@capacitor/core";

apps/client/lib/deep-links/examples.tsx
90:import { Share } from "@capacitor/share";
124:import { Capacitor, registerPlugin } from "@capacitor/core";

apps/client/BUILD_APK_INSTRUCTIONS.md
61:1. Edit `apps/client/capacitor.config.ts`

apps/client/ANDROID_SETUP_COMPLETE.md
44:1. @capacitor/app - App lifecycle
45:2. @capacitor/camera - Photo capture
46:3. @capacitor/device - Device info
47:4. @capacitor/filesystem - File operations
48:5. @capacitor/geolocation - GPS location
49:6. @capacitor/haptics - Vibration feedback
50:7. @capacitor/keyboard - Keyboard control
51:8. @capacitor/local-notifications - Local alerts
52:9. @capacitor/network - Network monitoring
53:10. @capacitor/push-notifications - Push alerts
54:11. @capacitor/share - Native sharing
55:12. @capacitor/splash-screen - Splash control
56:13. @capacitor/status-bar - Status bar styling
57:14. @capacitor/toast - Toast messages
61:15. @capacitor-community/barcode-scanner - QR code scanning
62:16. @capawesome-team/capacitor-android-foreground-service - Background tasks
164:### capacitor.config.ts
374:import { Camera } from "@capacitor/camera";
386:import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
397:import { Geolocation } from "@capacitor/geolocation";
427:- Capacitor Docs: https://capacitorjs.com/docs

apps/client/DEEP_LINKS_GUIDE.md
317:import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
380:- [Capacitor Deep Links Plugin](https://capacitorjs.com/docs/apis/app#deep-links)

apps/client/ANDROID_PERMISSIONS.md
263:1. **@capacitor/app** (7.1.0) - App lifecycle and state management
264:2. **@capacitor/camera** (7.0.2) - Camera access for photos
265:3. **@capacitor/device** (7.0.2) - Device information
266:4. **@capacitor/filesystem** (7.1.4) - File operations
267:5. **@capacitor/geolocation** (7.1.5) - Location services
268:6. **@capacitor/haptics** (7.0.2) - Haptic feedback
269:7. **@capacitor/keyboard** (7.0.3) - Keyboard management
270:8. **@capacitor/local-notifications** (7.0.3) - Local notifications
271:9. **@capacitor/network** (7.0.2) - Network status monitoring
272:10. **@capacitor/push-notifications** (7.0.3) - Push notification support
273:11. **@capacitor/share** (7.0.2) - Native share functionality
274:12. **@capacitor/splash-screen** (7.0.3) - Splash screen control
275:13. **@capacitor/status-bar** (7.0.3) - Status bar customization
276:14. **@capacitor/toast** (7.0.2) - Toast notifications
280:1. **@capacitor-community/barcode-scanner** (4.0.1) - QR code and barcode
282:2. **@capawesome-team/capacitor-android-foreground-service** (7.0.1) -
328:  `com.capawesome.capacitorjs.plugins.foregroundservice.ForegroundService`
439:- [Capacitor Documentation](https://capacitorjs.com/docs)

apps/client/IOS_MOBILE_APP_README.md
134:├── capacitor.config.ts       # Capacitor configuration
145:1. **Edit `apps/client/capacitor.config.ts`:**
173:iOS automatically uses your app's primary color. Update in `capacitor.config.ts`:
329:- See [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
339:- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)

apps/admin/android/app/src/main/assets/capacitor.plugins.json
3:		"pkg": "@capacitor/app",
4:		"classpath": "com.capacitorjs.plugins.app.AppPlugin"
7:		"pkg": "@capacitor/camera",
8:		"classpath": "com.capacitorjs.plugins.camera.CameraPlugin"
11:		"pkg": "@capacitor/device",
12:		"classpath": "com.capacitorjs.plugins.device.DevicePlugin"
15:		"pkg": "@capacitor/haptics",
16:		"classpath": "com.capacitorjs.plugins.haptics.HapticsPlugin"
19:		"pkg": "@capacitor/preferences",
20:		"classpath": "com.capacitorjs.plugins.preferences.PreferencesPlugin"
23:		"pkg": "@capacitor/push-notifications",
24:		"classpath": "com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin"

apps/client/android/capacitor.settings.gradle
1:// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN
2:include ':capacitor-android'
3:project(':capacitor-android').projectDir = new File('../../../node_modules/.pnpm/@capacitor+android@7.4.4_@capacitor+core@7.4.4/node_modules/@capacitor/android/capacitor')
5:include ':capacitor-community-barcode-scanner'
6:project(':capacitor-community-barcode-scanner').projectDir = new File('../../../node_modules/.pnpm/@capacitor-community+barcode-scanner@4.0.1_@capacitor+core@7.4.4/node_modules/@capacitor-community/barcode-scanner/android')
8:include ':capacitor-app'
9:project(':capacitor-app').projectDir = new File('../../../node_modules/.pnpm/@capacitor+app@7.1.0_@capacitor+core@7.4.4/node_modules/@capacitor/app/android')
11:include ':capacitor-camera'
12:project(':capacitor-camera').projectDir = new File('../../../node_modules/.pnpm/@capacitor+camera@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/camera/android')
14:include ':capacitor-device'
15:project(':capacitor-device').projectDir = new File('../../../node_modules/.pnpm/@capacitor+device@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/device/android')
17:include ':capacitor-filesystem'
18:project(':capacitor-filesystem').projectDir = new File('../../../node_modules/.pnpm/@capacitor+filesystem@7.1.4_@capacitor+core@7.4.4/node_modules/@capacitor/filesystem/android')
20:include ':capacitor-geolocation'
21:project(':capacitor-geolocation').projectDir = new File('../../../node_modules/.pnpm/@capacitor+geolocation@7.1.5_@capacitor+core@7.4.4/node_modules/@capacitor/geolocation/android')
23:include ':capacitor-haptics'
24:project(':capacitor-haptics').projectDir = new File('../../../node_modules/.pnpm/@capacitor+haptics@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/haptics/android')
26:include ':capacitor-keyboard'
27:project(':capacitor-keyboard').projectDir = new File('../../../node_modules/.pnpm/@capacitor+keyboard@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/keyboard/android')
29:include ':capacitor-local-notifications'
30:project(':capacitor-local-notifications').projectDir = new File('../../../node_modules/.pnpm/@capacitor+local-notifications@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/local-notifications/android')
32:include ':capacitor-network'
33:project(':capacitor-network').projectDir = new File('../../../node_modules/.pnpm/@capacitor+network@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/network/android')
35:include ':capacitor-share'
36:project(':capacitor-share').projectDir = new File('../../../node_modules/.pnpm/@capacitor+share@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/share/android')
38:include ':capacitor-splash-screen'
39:project(':capacitor-splash-screen').projectDir = new File('../../../node_modules/.pnpm/@capacitor+splash-screen@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/splash-screen/android')
41:include ':capacitor-status-bar'
42:project(':capacitor-status-bar').projectDir = new File('../../../node_modules/.pnpm/@capacitor+status-bar@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/status-bar/android')
44:include ':capacitor-toast'
45:project(':capacitor-toast').projectDir = new File('../../../node_modules/.pnpm/@capacitor+toast@7.0.2_@capacitor+core@7.4.4/node_modules/@capacitor/toast/android')
47:include ':capawesome-team-capacitor-android-foreground-service'
48:project(':capawesome-team-capacitor-android-foreground-service').projectDir = new File('../../../node_modules/.pnpm/@capawesome-team+capacitor-android-foreground-service@7.0.1_@capacitor+core@7.4.4/node_modules/@capawesome-team/capacitor-android-foreground-service/android')

apps/client/android/settings.gradle
10:include ':capacitor-cordova-android-plugins'
11:project(':capacitor-cordova-android-plugins').projectDir = new File('./capacitor-cordova-android-plugins/')
20:apply from: 'capacitor.settings.gradle'

apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/NetworkMonitorPlugin.kt
9:import com.getcapacitor.*
10:import com.getcapacitor.annotation.CapacitorPlugin

apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/DeviceAuthPlugin.kt
5:import com.getcapacitor.*
6:import com.getcapacitor.annotation.CapacitorPlugin

apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/PinAuthPlugin.kt
8:import com.getcapacitor.JSObject
9:import com.getcapacitor.Plugin
10:import com.getcapacitor.PluginCall
11:import com.getcapacitor.PluginMethod
12:import com.getcapacitor.annotation.CapacitorPlugin

apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt
12:import com.getcapacitor.*
13:import com.getcapacitor.annotation.CapacitorPlugin
14:import com.getcapacitor.annotation.PermissionCallback

apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/EnhancedNotificationsPlugin.kt
10:import com.getcapacitor.*
11:import com.getcapacitor.annotation.CapacitorPlugin
12:import com.getcapacitor.annotation.PermissionCallback

apps/admin/android/app/src/main/java/rw/ibimina/staff/tapmomo/TapMoMoPlugin.kt
10:import com.getcapacitor.JSObject
11:import com.getcapacitor.Plugin
12:import com.getcapacitor.PluginCall
13:import com.getcapacitor.PluginMethod
14:import com.getcapacitor.annotation.CapacitorPlugin

apps/admin/android/app/src/main/java/rw/ibimina/staff/MainActivity.java
4:import com.getcapacitor.BridgeActivity;

apps/client/android/app/src/main/java/rw/gov/ikanisa/ibimina/client/SmsUserConsentPlugin.kt
11:import com.getcapacitor.JSObject
12:import com.getcapacitor.Plugin
13:import com.getcapacitor.PluginCall
14:import com.getcapacitor.PluginMethod
15:import com.getcapacitor.annotation.ActivityCallback
16:import com.getcapacitor.annotation.CapacitorPlugin

apps/client/android/app/src/main/java/rw/gov/ikanisa/ibimina/client/MoMoNotificationListenerPlugin.java
9:import com.getcapacitor.JSObject;
10:import com.getcapacitor.Plugin;
11:import com.getcapacitor.PluginCall;
12:import com.getcapacitor.PluginMethod;
13:import com.getcapacitor.annotation.CapacitorPlugin;

apps/client/android/app/src/main/java/rw/gov/ikanisa/ibimina/client/MainActivity.java
4:import com.getcapacitor.BridgeActivity;

apps/client/android/app/src/main/java/rw/gov/ikanisa/ibimina/client/auth/DeviceAuthPlugin.kt
4:import com.getcapacitor.JSObject
5:import com.getcapacitor.Plugin
6:import com.getcapacitor.PluginCall
7:import com.getcapacitor.PluginMethod
8:import com.getcapacitor.annotation.CapacitorPlugin

apps/client/android/app/src/main/AndroidManifest.xml
65:            android:name="com.capawesome.capacitorjs.plugins.foregroundservice.ForegroundService"

apps/admin/android/app/src/test/java/rw/ibimina/staff/plugins/EnhancedNotificationsPluginTest.kt
5:import com.getcapacitor.Bridge
6:import com.getcapacitor.PluginCall

apps/admin/android/app/src/test/java/rw/ibimina/staff/plugins/NetworkMonitorPluginTest.kt
6:import com.getcapacitor.Bridge
7:import com.getcapacitor.PluginCall

apps/admin/android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java
1:package com.getcapacitor.myapp;

apps/admin/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
1:package com.getcapacitor.myapp;
24:        assertEquals("com.getcapacitor.app", appContext.getPackageName());

apps/admin/android/app/build.gradle
10:def capacitorServerUrl = System.getenv("CAPACITOR_SERVER_URL") ?: project.findProperty("CAPACITOR_SERVER_URL")
29:        if (capacitorServerUrl) {
30:            buildConfigField "String", "CAPACITOR_SERVER_URL", "\"${capacitorServerUrl}\""
115:    implementation project(':capacitor-android')
116:    implementation project(':capacitor-cordova-android-plugins')
147:apply from: 'capacitor.build.gradle'

apps/admin/android/app/capacitor.build.gradle
1:// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN
10:apply from: "../capacitor-cordova-android-plugins/cordova.variables.gradle"
12:    implementation project(':capacitor-app')
13:    implementation project(':capacitor-camera')
14:    implementation project(':capacitor-device')
15:    implementation project(':capacitor-haptics')
16:    implementation project(':capacitor-preferences')
17:    implementation project(':capacitor-push-notifications')

apps/client/android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java
1:package com.getcapacitor.myapp;

apps/admin/ANDROID_IMPLEMENTATION_SUMMARY.md
180:  "@capacitor/core": "^7.4.4",
181:  "@capacitor/cli": "^7.4.4",
182:  "@capacitor/android": "^7.4.4",
183:  "@capacitor/camera": "^7.0.2",
184:  "@capacitor/push-notifications": "^7.0.3",
185:  "@capacitor/device": "^7.0.2",
186:  "@capacitor/haptics": "^7.0.2",
187:  "@capacitor/preferences": "^7.0.2",
188:  "@capacitor/app": "^7.1.0"

apps/admin/package.json
32:    "@capacitor/android": "^7.4.4",
33:    "@capacitor/app": "^7.1.0",
34:    "@capacitor/camera": "^7.0.2",
35:    "@capacitor/cli": "^7.4.4",
36:    "@capacitor/core": "^7.4.4",
37:    "@capacitor/device": "^7.0.2",
38:    "@capacitor/haptics": "^7.0.2",
39:    "@capacitor/preferences": "^7.0.2",

apps/admin/capacitor.config.js
1:/** @type {import('@capacitor/cli').CapacitorConfig} */

apps/admin/FINAL_IMPLEMENTATION_REPORT.md
37:1. **capacitor.config.ts** (68 lines) - Capacitor configuration

apps/client/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
1:package com.getcapacitor.myapp;
24:        assertEquals("com.getcapacitor.app", appContext.getPackageName());

apps/client/android/app/build.gradle
50:        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
59:    implementation project(':capacitor-android')
76:    implementation project(':capacitor-cordova-android-plugins')
125:apply from: 'capacitor.build.gradle'

apps/client/android/app/capacitor.build.gradle
1:// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN
10:apply from: "../capacitor-cordova-android-plugins/cordova.variables.gradle"
12:    implementation project(':capacitor-community-barcode-scanner')
13:    implementation project(':capacitor-app')
14:    implementation project(':capacitor-camera')
15:    implementation project(':capacitor-device')
16:    implementation project(':capacitor-filesystem')
17:    implementation project(':capacitor-geolocation')
18:    implementation project(':capacitor-haptics')
19:    implementation project(':capacitor-keyboard')
20:    implementation project(':capacitor-local-notifications')
21:    implementation project(':capacitor-network')
22:    implementation project(':capacitor-share')
23:    implementation project(':capacitor-splash-screen')
24:    implementation project(':capacitor-status-bar')
25:    implementation project(':capacitor-toast')
26:    implementation project(':capawesome-team-capacitor-android-foreground-service')

apps/client/ANDROID_IMPLEMENTATION_GUIDE.md
23:import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
24:import { Geolocation } from "@capacitor/geolocation";
25:import { PushNotifications } from "@capacitor/push-notifications";
26:import { LocalNotifications } from "@capacitor/local-notifications";
27:import { Haptics, ImpactStyle } from "@capacitor/haptics";
28:import { Share } from "@capacitor/share";
29:import { Device } from "@capacitor/device";
30:import { Network } from "@capacitor/network";
31:import { Toast } from "@capacitor/toast";
32:import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
93:import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
185:import { Device } from "@capacitor/device";
281:import { PushNotifications } from "@capacitor/push-notifications";
282:import type { PushNotificationSchema } from "@capacitor/push-notifications";
370:import { Geolocation } from "@capacitor/geolocation";
490:import { Network } from "@capacitor/network";
491:import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
554:import { App } from "@capacitor/app";
619:import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
707:import { Haptics, ImpactStyle } from "@capacitor/haptics";
727:import { Network } from "@capacitor/network";

apps/client/NOTIFICATION_LISTENER_SMS_GUIDE.md
193:import { Capacitor } from "@capacitor/core";
194:import { registerPlugin } from "@capacitor/core";

apps/client/package.json
31:    "@capacitor-community/barcode-scanner": "^4.0.1",
32:    "@capacitor/android": "^7.4.4",
33:    "@capacitor/app": "^7.1.0",
34:    "@capacitor/camera": "^7.0.2",
35:    "@capacitor/cli": "^7.4.4",
36:    "@capacitor/core": "^7.4.4",
37:    "@capacitor/device": "^7.0.2",
38:    "@capacitor/filesystem": "^7.1.4",
39:    "@capacitor/geolocation": "^7.1.5",
40:    "@capacitor/haptics": "^7.0.2",
41:    "@capacitor/ios": "^7.4.4",
42:    "@capacitor/keyboard": "^7.0.3",
43:    "@capacitor/local-notifications": "^7.0.3",
44:    "@capacitor/network": "^7.0.2",
45:    "@capacitor/share": "^7.0.2",
46:    "@capacitor/splash-screen": "^7.0.3",
47:    "@capacitor/status-bar": "^7.0.3",
48:    "@capacitor/toast": "^7.0.2",
49:    "@capawesome-team/capacitor-android-foreground-service": "^7.0.1",

apps/client/APK_BUILD_GUIDE.md
93:The `capacitor.config.ts` file is already configured. For production builds, you
237:Edit `apps/client/capacitor.config.ts` to customize:
335:'android/app/src/main/assets/capacitor.config.json'"**
371:- [ ] Update `capacitor.config.ts` with production server URL
386:- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
395:- Check the [Capacitor GitHub](https://github.com/ionic-team/capacitor)

apps/client/ANDROID_QUICKSTART.md
71:├── capacitor.config.ts         # Capacitor configuration
80:The app connects to a server URL. Configure it in `capacitor.config.ts`:
93:Edit `capacitor.config.ts`:

apps/client/CLIENT_MOBILE_APP_README.md
30:- ✅ **@capacitor/app** (7.1.0) - App lifecycle events
31:- ✅ **@capacitor/camera** (7.0.2) - Camera access for document uploads
32:- ✅ **@capacitor/device** (7.0.2) - Device information
33:- ✅ **@capacitor/haptics** (7.0.2) - Haptic feedback
34:- ✅ **@capacitor/keyboard** (7.0.3) - Keyboard management
35:- ✅ **@capacitor/push-notifications** (7.0.3) - Push notifications
36:- ✅ **@capacitor/local-notifications** (7.0.3) - Local notifications
37:- ✅ **@capacitor/network** (7.0.2) - Network status detection
38:- ✅ **@capacitor/share** (7.0.2) - Native sharing
39:- ✅ **@capacitor/splash-screen** (7.0.3) - Splash screen
40:- ✅ **@capacitor/status-bar** (7.0.3) - Status bar styling
41:- ✅ **@capacitor/toast** (7.0.2) - Toast notifications
42:- ✅ **@capacitor/filesystem** (7.1.4) - File system access
43:- ✅ **@capacitor/geolocation** (7.1.5) - GPS location
44:- ✅ **@capacitor-community/barcode-scanner** (4.0.1) - QR/barcode scanning
45:- ✅ **@capawesome-team/capacitor-android-foreground-service** (7.0.1) - Background sync
179:├── capacitor.config.ts             # Capacitor configuration
190:1. **Edit `capacitor.config.ts`:**
260:- ✅ Certificate pinning ready (configure in capacitor.config.ts)
333:- See Capacitor docs: https://capacitorjs.com/docs/android

apps/client/SMS_INGESTION_GUIDE.md
62:npm install @capacitor-community/sms
386:import { Capacitor } from "@capacitor/core";

apps/client/CLIENT_APP_BUILD_READY.md
28:✅ **apps/client/package.json** - Removed @capacitor/push-notifications

apps/client/capacitor.config.ts
1:import type { CapacitorConfig } from "@capacitor/cli";

apps/client/APK_SETUP_SUMMARY.md
19:- `@capacitor/core` (v7.4.4) - Core Capacitor functionality
20:- `@capacitor/cli` (v7.4.4) - Capacitor command-line tools
21:- `@capacitor/android` (v7.4.4) - Android platform support
25:- Created `capacitor.config.ts` with production-ready settings
103:3. **capacitor.config.ts**
167:- `capacitor.config.ts` - Main Capacitor configuration
312:- [Capacitor Docs](https://capacitorjs.com/docs) - Official documentation
318:- [Capacitor CLI](https://capacitorjs.com/docs/cli)

apps/client/build-android-aab.sh
99:if grep -q "@capacitor/push-notifications" package.json 2>/dev/null; then
100:    echo -e "${YELLOW}⚠ Removing @capacitor/push-notifications...${NC}"
102:    grep -v "@capacitor/push-notifications" package.json > package.json.tmp

apps/client/BUILD_IOS_INSTRUCTIONS.md
29:# Install Node dependencies (including @capacitor/ios)
154:1. **Edit `apps/client/capacitor.config.ts`:**
325:- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
333:- Check [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios/troubleshooting)
334:- Search [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor+ios)

apps/admin/ANDROID_BUILD_GUIDE.md
106:[ ! -f capacitor.config.js ] && echo "module.exports = require('./capacitor.config.ts.bak')" > capacitor.config.js

TAPMOMO_PRODUCTION_DEPLOYMENT_COMPLETE.md
26:**Location:** `apps/admin/lib/capacitor/tapmomo.ts`

apps/admin/BUILD_FOR_PLAY_STORE.md
348:3. Check Capacitor docs: https://capacitorjs.com

```

</details>

### `rg -n --heading "ionic"`

<details>
<summary>Full command output</summary>

```text
NATIVE_REFACTORING_PLAN.md
673:npm uninstall @ionic/react \
674:              @ionic/react-router \
675:              ionicons \
676:              @ionic/core
680:find src/components -name "*ionic*" -type f -delete

docs/IOS_APP_SETUP_GUIDE.md
533:- Review Capacitor iOS issues: https://github.com/ionic-team/capacitor/issues

pnpm-lock.yaml
2374:  '@ionic/cli-framework-output@2.2.8':
2378:  '@ionic/utils-array@2.1.6':
2382:  '@ionic/utils-fs@3.1.7':
2386:  '@ionic/utils-object@2.1.6':
2390:  '@ionic/utils-process@2.1.12':
2394:  '@ionic/utils-stream@3.1.7':
2398:  '@ionic/utils-subprocess@3.0.1':
2402:  '@ionic/utils-terminal@2.3.5':
10340:      '@ionic/cli-framework-output': 2.2.8
10341:      '@ionic/utils-subprocess': 3.0.1
10342:      '@ionic/utils-terminal': 2.3.5
11410:  '@ionic/cli-framework-output@2.2.8':
11412:      '@ionic/utils-terminal': 2.3.5
11418:  '@ionic/utils-array@2.1.6':
11425:  '@ionic/utils-fs@3.1.7':
11434:  '@ionic/utils-object@2.1.6':
11441:  '@ionic/utils-process@2.1.12':
11443:      '@ionic/utils-object': 2.1.6
11444:      '@ionic/utils-terminal': 2.3.5
11452:  '@ionic/utils-stream@3.1.7':
11459:  '@ionic/utils-subprocess@3.0.1':
11461:      '@ionic/utils-array': 2.1.6
11462:      '@ionic/utils-fs': 3.1.7
11463:      '@ionic/utils-process': 2.1.12
11464:      '@ionic/utils-stream': 3.1.7
11465:      '@ionic/utils-terminal': 2.3.5
11472:  '@ionic/utils-terminal@2.3.5':
17476:      '@ionic/utils-fs': 3.1.7
17477:      '@ionic/utils-terminal': 2.3.5

feature-tapmomo/INTEGRATION_GUIDE.md
165:import { IonButton, IonIcon } from "@ionic/react";
166:import { nfcOutline } from "ionicons/icons";

REFACTORING_PLAN.md
84:    "@ionic/react",
85:    "@ionic/react-router",
86:    "ionicons"
332:npm uninstall @ionic/react @ionic/react-router ionicons

apps/client/APK_BUILD_GUIDE.md
395:- Check the [Capacitor GitHub](https://github.com/ionic-team/capacitor)

```

</details>

## JavaScript Dependency Snapshots

### Root `package.json`

#### `dependencies`

```json
{
  "@capacitor/android": "^7.4.4",
  "@capacitor/core": "^7.4.4",
  "@ibimina/lib": "workspace:^",
  "@ibimina/ui": "workspace:^",
  "openai": "^6.7.0"
}
```

#### `devDependencies`

```json
{
  "@capacitor/cli": "^7.4.4",
  "@commitlint/cli": "^20.1.0",
  "@commitlint/config-conventional": "^20.0.0",
  "@supabase/supabase-js": "^2.78.0",
  "@types/node": "20.19.21",
  "@typescript-eslint/eslint-plugin": "^6.21.0",
  "@typescript-eslint/parser": "^6.21.0",
  "c8": "^10.1.3",
  "eslint": "^8.57.0",
  "eslint-config-next": "^14.2.33",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-prettier": "^5.5.4",
  "eslint-plugin-react-hooks": "^7.0.0",
  "globals": "^16.4.0",
  "husky": "^9.1.7",
  "istanbul-lib-coverage": "^3.2.2",
  "lint-staged": "^16.2.6",
  "prettier": "^3.6.2",
  "ts-node": "^10.9.1",
  "tsconfig-paths": "^4.2.0",
  "tsx": "^4.20.6",
  "typescript": "5.9.3"
}
```

### `apps/client/package.json`

#### `dependencies`

```json
{
  "@capacitor-community/barcode-scanner": "^4.0.1",
  "@capacitor/android": "^7.4.4",
  "@capacitor/app": "^7.1.0",
  "@capacitor/camera": "^7.0.2",
  "@capacitor/cli": "^7.4.4",
  "@capacitor/core": "^7.4.4",
  "@capacitor/device": "^7.0.2",
  "@capacitor/filesystem": "^7.1.4",
  "@capacitor/geolocation": "^7.1.5",
  "@capacitor/haptics": "^7.0.2",
  "@capacitor/ios": "^7.4.4",
  "@capacitor/keyboard": "^7.0.3",
  "@capacitor/local-notifications": "^7.0.3",
  "@capacitor/network": "^7.0.2",
  "@capacitor/share": "^7.0.2",
  "@capacitor/splash-screen": "^7.0.3",
  "@capacitor/status-bar": "^7.0.3",
  "@capacitor/toast": "^7.0.2",
  "@capawesome-team/capacitor-android-foreground-service": "^7.0.1",
  "@ibimina/config": "workspace:*",
  "@ibimina/data-access": "workspace:*",
  "@ibimina/lib": "workspace:*",
  "@ibimina/locales": "workspace:*",
  "@ibimina/ui": "workspace:*",
  "@sentry/nextjs": "^10.22.0",
  "@sentry/types": "^8.37.1",
  "@supabase/ssr": "^0.7.0",
  "@supabase/supabase-js": "^2.74.0",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.545.0",
  "next": "15.5.4",
  "next-intl": "^4.4.0",
  "next-pwa": "^5.6.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "web-push": "^3.6.7",
  "workbox-cacheable-response": "^6.6.0",
  "workbox-core": "^6.6.0",
  "workbox-expiration": "^6.6.0",
  "workbox-navigation-preload": "^6.6.0",
  "workbox-precaching": "^6.6.0",
  "workbox-routing": "^6.6.0",
  "workbox-strategies": "^6.6.0",
  "zod": "^3.23.8"
}
```

#### `devDependencies`

```json
{
  "@eslint/eslintrc": "^3",
  "@playwright/test": "^1.56.1",
  "@tailwindcss/postcss": "^4",
  "@testing-library/dom": "^10.4.1",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/supertest": "^2.0.12",
  "@types/web-push": "^3.6.3",
  "eslint": "^9",
  "eslint-config-next": "15.5.4",
  "supertest": "^7.1.1",
  "tailwindcss": "^4",
  "tsx": "^4.20.6",
  "typescript": "^5"
}
```

## Native Dependency Manifests

### Android Gradle Files

#### `apps/client/android/build.gradle`

```gradle
dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
```

#### `apps/client/android/app/build.gradle`

```gradle
dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation project(':feature-tapmomo')

    def composeBom = platform('androidx.compose:compose-bom:2024.06.00')
    implementation composeBom
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-graphics'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
    implementation "androidx.activity:activity-compose:${rootProject.ext.androidxActivityVersion}"
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.8.6'
    debugImplementation 'androidx.compose.ui:ui-tooling'
    debugImplementation 'androidx.compose.ui:ui-test-manifest'

    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')

    // Biometric Authentication
    implementation "androidx.biometric:biometric:1.2.0-alpha05"

    // Work Manager for background tasks
    implementation "androidx.work:work-runtime:2.9.1"
    implementation "androidx.work:work-runtime-ktx:2.9.1"

    // Google Play Services for enhanced features
    implementation "com.google.android.gms:play-services-location:21.3.0"
    implementation "com.google.android.gms:play-services-maps:19.0.0"
    implementation "com.google.android.gms:play-services-auth:21.2.0"

    // Camera and image processing
    implementation "androidx.camera:camera-camera2:1.4.1"
    implementation "androidx.camera:camera-lifecycle:1.4.1"
    implementation "androidx.camera:camera-view:1.4.1"

    // Material Design components
    implementation "com.google.android.material:material:1.12.0"

    // Compose UI
    implementation platform("androidx.compose:compose-bom:2024.09.02")
    implementation "androidx.activity:activity-compose:1.9.3"
    implementation "androidx.compose.material3:material3"
    implementation "androidx.compose.ui:ui"
    implementation "androidx.compose.ui:ui-tooling-preview"
    implementation "androidx.compose.material:material-icons-extended"
    debugImplementation "androidx.compose.ui:ui-tooling"
    debugImplementation "androidx.compose.ui:ui-test-manifest"

    // Lifecycle & Coroutines
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.8.6"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0"

    // Room persistence
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    kapt "androidx.room:room-compiler:2.6.1"
    androidTestImplementation "androidx.room:room-testing:2.6.1"

    // Testing utilities
    androidTestImplementation "androidx.test:core:1.6.1"
    androidTestImplementation "org.mockito:mockito-android:5.13.0"
    androidTestImplementation "org.mockito.kotlin:mockito-kotlin:5.2.1"
    androidTestImplementation "org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0"
}
```

#### `apps/client/android/app/capacitor.build.gradle`

```gradle
dependencies {
    implementation project(':capacitor-community-barcode-scanner')
    implementation project(':capacitor-app')
    implementation project(':capacitor-camera')
    implementation project(':capacitor-device')
    implementation project(':capacitor-filesystem')
    implementation project(':capacitor-geolocation')
    implementation project(':capacitor-haptics')
    implementation project(':capacitor-keyboard')
    implementation project(':capacitor-local-notifications')
    implementation project(':capacitor-network')
    implementation project(':capacitor-share')
    implementation project(':capacitor-splash-screen')
    implementation project(':capacitor-status-bar')
    implementation project(':capacitor-toast')
    implementation project(':capawesome-team-capacitor-android-foreground-service')

}
```

### CocoaPods

- No `Podfile` or `Podfile.lock` is present in the repository; CocoaPods
  dependency inventory is currently unavailable.
