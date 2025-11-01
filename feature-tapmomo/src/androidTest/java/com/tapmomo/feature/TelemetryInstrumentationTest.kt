package com.tapmomo.feature

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tapmomo.feature.internal.TestHooks
import com.tapmomo.feature.telemetry.TelemetryLogger
import com.tapmomo.feature.TapMoMoConfig
import com.tapmomo.feature.Network
import com.tapmomo.feature.ussd.UssdLauncher
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TelemetryInstrumentationTest {

    private val recordedEvents = mutableListOf<Pair<String, Map<String, Any?>>>()
    private val delegate = TelemetryLogger.TelemetryDelegate { event, properties ->
        recordedEvents.add(event to properties)
    }

    @Before
    fun setUp() {
        recordedEvents.clear()
        TestHooks.reset()
        val context = ApplicationProvider.getApplicationContext<Context>()
        TapMoMo.init(context, TapMoMoConfig())
        TelemetryLogger.registerDelegate(delegate)
    }

    @After
    fun tearDown() {
        TelemetryLogger.unregisterDelegate(delegate)
        TestHooks.reset()
    }

    @Test
    fun ussdFallbackEmitsTelemetryWhenDialMockHandlesRequest() {
        TestHooks.ussdDirectHandler = { _, _, _ -> false }
        TestHooks.ussdDialHandler = { _, _ -> true }

        val context = ApplicationProvider.getApplicationContext<Context>()
        val result = UssdLauncher.launchUssd(context, Network.MTN, "123456", 500, null)

        assertTrue(result)
        assertTrue(
            recordedEvents.any { (event, _) -> event == "tapmomo_ussd_launch_attempt" }
        )
        assertTrue(
            recordedEvents.any { (event, properties) ->
                event == "tapmomo_ussd_launch" && properties["method"] == "test_override_dial"
            }
        )
    }
}
