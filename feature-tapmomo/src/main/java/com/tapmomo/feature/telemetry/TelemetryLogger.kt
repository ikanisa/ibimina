package com.tapmomo.feature.telemetry

import android.content.Context
import android.os.Bundle
import android.util.Log
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Lightweight telemetry dispatcher that forwards TapMoMo events to any
 * available analytics SDK (AppCenter or Firebase) and also exposes a testing
 * delegate hook so instrumentation tests can assert emitted events.
 */
object TelemetryLogger {

    private const val TAG = "TapMoMoTelemetry"

    private val isFirebaseAvailable = AtomicBoolean(true)
    private val isAppCenterAvailable = AtomicBoolean(true)
    private val delegates = CopyOnWriteArrayList<TelemetryDelegate>()
    @Volatile
    private var applicationContext: Context? = null

    /**
     * Initialise the telemetry logger with an application context. Must be
     * called before attempting to emit Firebase events.
     */
    fun initialize(context: Context) {
        applicationContext = context.applicationContext
    }

    /**
     * Register a delegate which will receive every emitted event. Primarily
     * used by instrumentation tests to assert behaviour.
     */
    fun registerDelegate(delegate: TelemetryDelegate) {
        delegates.addIfAbsent(delegate)
    }

    /**
     * Remove a previously registered delegate.
     */
    fun unregisterDelegate(delegate: TelemetryDelegate) {
        delegates.remove(delegate)
    }

    /**
     * Emit an analytics event. Failures are swallowed to avoid impacting the
     * UX of the tap flow.
     */
    fun track(event: String, properties: Map<String, Any?> = emptyMap()) {
        delegates.forEach { delegate ->
            try {
                delegate.onEvent(event, properties)
            } catch (ignored: Throwable) {
                Log.w(TAG, "Delegate threw while handling $event", ignored)
            }
        }

        Log.d(TAG, "event=$event properties=$properties")
        dispatchToAppCenter(event, properties)
        dispatchToFirebase(event, properties)
    }

    private fun dispatchToAppCenter(event: String, properties: Map<String, Any?>) {
        if (!isAppCenterAvailable.get()) return
        try {
            val analyticsClass = Class.forName("com.microsoft.appcenter.analytics.Analytics")
            val trackMethod = analyticsClass.getDeclaredMethod(
                "trackEvent",
                String::class.java,
                Map::class.java
            )
            val converted = properties.mapValues { it.value?.toString() ?: "" }
            trackMethod.invoke(null, event, converted)
        } catch (classMissing: ClassNotFoundException) {
            isAppCenterAvailable.set(false)
        } catch (error: Throwable) {
            isAppCenterAvailable.set(false)
            Log.w(TAG, "AppCenter track failed for $event", error)
        }
    }

    private fun dispatchToFirebase(event: String, properties: Map<String, Any?>) {
        if (!isFirebaseAvailable.get()) return
        val context = applicationContext ?: return
        try {
            val firebaseClass = Class.forName("com.google.firebase.analytics.FirebaseAnalytics")
            val getInstance = firebaseClass.getDeclaredMethod("getInstance", Context::class.java)
            val firebaseAnalytics = getInstance.invoke(null, context)
            val logEvent = firebaseClass.getDeclaredMethod(
                "logEvent",
                String::class.java,
                Bundle::class.java
            )
            val bundle = Bundle()
            properties.forEach { (key, value) ->
                val safeKey = key.take(40).replace(Regex("[^a-zA-Z0-9_]") , "_")
                when (value) {
                    null -> Unit
                    is Int -> bundle.putInt(safeKey, value)
                    is Long -> bundle.putLong(safeKey, value)
                    is Double -> bundle.putDouble(safeKey, value)
                    is Float -> bundle.putDouble(safeKey, value.toDouble())
                    is Number -> bundle.putDouble(safeKey, value.toDouble())
                    is Boolean -> bundle.putString(safeKey, value.toString())
                    else -> bundle.putString(safeKey, value.toString())
                }
            }
            val sanitizedEvent = event.take(40).replace(Regex("[^a-zA-Z0-9_]") , "_")
            logEvent.invoke(firebaseAnalytics, sanitizedEvent, bundle)
        } catch (classMissing: ClassNotFoundException) {
            isFirebaseAvailable.set(false)
        } catch (error: Throwable) {
            isFirebaseAvailable.set(false)
            Log.w(TAG, "Firebase track failed for $event", error)
        }
    }

    fun interface TelemetryDelegate {
        fun onEvent(event: String, properties: Map<String, Any?>)
    }
}
