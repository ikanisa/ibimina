# Android Release Signing

## Generate Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore ibimina-release.keystore \
  -alias ibimina \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <your-store-password> \
  -keypass <your-key-password> \
  -dname "CN=Ibimina, OU=Mobile, O=Ibimina, L=Kigali, ST=Kigali, C=RW"
```

## Configure gradle.properties

Add to `android/gradle.properties`:

```
IBIMINA_RELEASE_STORE_FILE=ibimina-release.keystore
IBIMINA_RELEASE_KEY_ALIAS=ibimina
IBIMINA_RELEASE_STORE_PASSWORD=<your-store-password>
IBIMINA_RELEASE_KEY_PASSWORD=<your-key-password>
```

## Build Release APK

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Build Release AAB (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB location: `android/app/build/outputs/bundle/release/app-release.aab`
