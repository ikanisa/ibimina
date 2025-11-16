import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use { load(it) }
    }
}

fun resolveConfig(key: String, required: Boolean = true, fallback: String? = null): String {
    val value = localProperties.getProperty(key) ?: System.getenv(key)
    if (!value.isNullOrBlank()) {
        return value
    }
    return fallback ?: if (required) {
        error("Missing required configuration value for $key. Provide it via local.properties or as an environment variable.")
    } else {
        ""
    }
}

fun String.asBuildConfigValue(): String = "\"${this.replace("\"", "\\\"")}\""

val supabaseUrl = resolveConfig("SUPABASE_URL")
val supabaseAnonKey = resolveConfig("SUPABASE_ANON_KEY")
val openAiApiKey = resolveConfig("OPENAI_API_KEY")
val openAiApiBaseUrl = resolveConfig("OPENAI_API_BASE_URL", required = false, fallback = "https://api.openai.com/")

android {
    namespace = "com.ibimina.staff"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.ibimina.staff"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }

        buildConfigField("String", "SUPABASE_URL", supabaseUrl.asBuildConfigValue())
        buildConfigField("String", "SUPABASE_ANON_KEY", supabaseAnonKey.asBuildConfigValue())
        buildConfigField("String", "OPENAI_API_KEY", openAiApiKey.asBuildConfigValue())
        buildConfigField("String", "OPENAI_API_BASE_URL", openAiApiBaseUrl.asBuildConfigValue())
        vectorDrawables.useSupportLibrary = true

        val properties = Properties()
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.exists()) {
            properties.load(localPropertiesFile.inputStream())
        }

        fun configValue(key: String, envKey: String = key): String {
            return properties.getProperty(key) ?: System.getenv(envKey) ?: ""
        }

        val supabaseUrl = configValue("SUPABASE_URL")
        val supabaseAnonKey = configValue("SUPABASE_ANON_KEY")
        val openAiKey = configValue("OPENAI_API_KEY")

        buildConfigField("String", "SUPABASE_URL", "\"${supabaseUrl}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${supabaseAnonKey}\"")
        buildConfigField("String", "OPENAI_API_KEY", "\"${openAiKey}\"")
        buildConfigField("String", "OPENAI_API_BASE_URL", "\"https://api.openai.com/\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.4"
        kotlinCompilerExtensionVersion = "1.5.15"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.activity:activity-compose:1.9.3")

    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")

    implementation("androidx.navigation:navigation-compose:2.8.3")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-android-compiler:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    implementation("io.github.jan.supabase:postgrest-kt:2.5.3")
    implementation("io.github.jan.supabase:gotrue-kt:2.5.3")
    implementation("io.github.jan.supabase:realtime-kt:2.5.3")
    implementation("io.github.jan.supabase:storage-kt:2.5.3")
    implementation("io.github.jan.supabase:functions-kt:2.5.3")

    implementation("com.aallam.openai:openai-client:3.5.0")

    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}

kapt {
    correctErrorTypes = true
}
