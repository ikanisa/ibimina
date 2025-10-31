# ProGuard rules for TapMoMo library

# Keep HCE service for NFC
-keep class com.tapmomo.feature.nfc.PayeeCardService { *; }

# Keep data models for serialization
-keep class com.tapmomo.feature.data.models.** { *; }
-keepclassmembers class com.tapmomo.feature.data.models.** { *; }

# Keep public API
-keep class com.tapmomo.feature.TapMoMo { *; }
-keep class com.tapmomo.feature.TapMoMoConfig { *; }
-keep enum com.tapmomo.feature.Network { *; }

# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.tapmomo.feature.**$$serializer { *; }
-keepclassmembers class com.tapmomo.feature.** {
    *** Companion;
}
-keepclasseswithmembers class com.tapmomo.feature.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

# Ktor
-keep class io.ktor.** { *; }
-keepclassmembers class io.ktor.** { volatile <fields>; }
-dontwarn kotlinx.atomicfu.**
-dontwarn io.netty.**
-dontwarn com.typesafe.**
-dontwarn org.slf4j.**
