# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep HCE Service
-keep public class com.tapmomo.feature.nfc.PayeeCardService

# Keep Activities
-keep public class com.tapmomo.feature.ui.TapMoMoGetPaidActivity
-keep public class com.tapmomo.feature.ui.TapMoMoPayActivity
