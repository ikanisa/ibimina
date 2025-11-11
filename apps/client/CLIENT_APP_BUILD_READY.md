# ✅ CLIENT APP - READY FOR GOOGLE PLAY & APP STORE

## Summary

Both **Android AAB** and **iOS IPA** build scripts are ready for the Ibimina
Client (Member) App.

---

## 📦 Files Created

```
apps/client/
├── build-android-aab.sh          ← Android AAB builder (executable)
├── build-ios-ipa.sh              ← iOS IPA builder (executable)
└── BUILD_FOR_STORES.md           ← Complete build guide
```

---

## ✅ Firebase Removed

All Firebase references cleaned from client app:

✅ **apps/client/android/build.gradle** - Removed Google Services classpath  
✅ **apps/client/android/app/build.gradle** - Removed google-services plugin
block  
✅ **apps/client/package.json** - Removed @capacitor/push-notifications

**Verification:**

```bash
grep -r "firebase\|google-services" apps/client/android --include="*.gradle"
# Result: No matches ✅

grep "push-notifications" apps/client/package.json
# Result: No matches ✅
```

---

## 🚀 How to Build

### Android AAB (Google Play)

```bash
cd apps/client

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Build AAB (5-10 minutes)
./build-android-aab.sh
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA (App Store)

```bash
cd apps/client

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Build IPA (15-20 minutes, macOS only)
./build-ios-ipa.sh
```

**Output:** `build/Ibimina-Client.ipa`

---

## 📤 Upload Instructions

### Google Play Internal Testing

1. Go to: https://play.google.com/console
2. Create app → **Ibimina** (if first time)
3. Complete: Privacy Policy, Data Safety, Content Rating
4. Navigate to: **Testing → Internal testing**
5. Upload: **app-release.aab**
6. Add testers (member emails)
7. Start rollout

### App Store TestFlight

1. Go to: https://appstoreconnect.apple.com
2. Create app → **Ibimina** (if first time)
3. Complete: App Privacy, Screenshots
4. Upload IPA via Xcode Organizer or `xcrun altool`
5. Add internal testers (up to 100)
6. Enable external testing (optional, requires review)

---

## ⏱️ Timeline

| Task                   | Android  | iOS       |
| ---------------------- | -------- | --------- |
| **Build**              | 5-10 min | 15-20 min |
| **Upload**             | 5 min    | 10 min    |
| **Processing**         | Instant  | 5-10 min  |
| **Internal Testing**   | Instant  | Instant   |
| **Review (if needed)** | N/A      | 1-2 days  |
| **Members Install**    | Instant  | Instant   |

**Total Time to Member Hands:** 1-2 hours (Android), 1-2 days (iOS)

---

## ✅ Pre-Build Checklist

### Both Platforms

- [ ] Environment variables set (`NEXT_PUBLIC_SUPABASE_URL`, etc.)
- [ ] Node.js 20+, pnpm 10+ installed
- [ ] Privacy policy page live at `https://app.ibimina.rw/privacy`

### Android Only

- [ ] Java 17+ installed
- [ ] Android SDK installed (`ANDROID_HOME` set)
- [ ] Google Play Console account created ($25 one-time)

### iOS Only

- [ ] macOS with Xcode 15+
- [ ] Apple Developer account ($99/year)
- [ ] App ID created: `rw.ibimina.client`
- [ ] Distribution certificate + provisioning profile

---

## 🎯 What's Included

### Client App Features

✅ Group savings & contributions  
✅ Account balances & history  
✅ NFC payments (TapMoMo)  
✅ Member dashboard  
✅ Biometric authentication  
✅ Join group requests  
✅ Transaction receipts  
✅ Multi-language support

### Technical Stack

- **Framework:** Next.js 15 + React 19
- **Mobile Wrapper:** Capacitor 7.4.4
- **Backend:** Supabase
- **Authentication:** Biometric + Passkeys
- **Payments:** NFC HCE (Android), NFC reader (iOS)

---

## 💰 Costs

| Item                    | Cost     | Frequency |
| ----------------------- | -------- | --------- |
| Google Play Console     | $25      | One-time  |
| Apple Developer Program | $99      | Annual    |
| **Total Year 1**        | **$124** |           |
| **Total Year 2+**       | **$99**  |           |

---

## 📞 Support

**Build issues?** Check `BUILD_FOR_STORES.md` for troubleshooting.

**Store submission issues?**

- Ensure privacy policy is accessible
- Complete all required metadata
- Provide demo account for reviewers

---

## 🎉 Ready to Ship!

Both build scripts are tested and ready. Run them now to generate
production-ready builds:

```bash
# Android (10 minutes)
cd apps/client && ./build-android-aab.sh

# iOS (20 minutes, macOS only)
cd apps/client && ./build-ios-ipa.sh
```

**Your member app will be in users' hands within 1-2 days!** 🚀
