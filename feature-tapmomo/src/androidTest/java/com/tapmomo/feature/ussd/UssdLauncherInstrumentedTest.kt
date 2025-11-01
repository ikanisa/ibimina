package com.tapmomo.feature.ussd

import android.Manifest
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tapmomo.feature.Network
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class UssdLauncherInstrumentedTest {

    @Test
    fun launchUssd_withoutPermissions_requestsRuntimePermissions() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        val result = UssdLauncher.launchUssd(
            context = context,
            network = Network.MTN,
            merchantId = "123456",
            amount = 100,
            subscriptionId = null
        )

        assertTrue(result is UssdLaunchResult.PermissionRequired)
        val permissions = (result as UssdLaunchResult.PermissionRequired).permissions.toSet()
        assertTrue(permissions.contains(Manifest.permission.CALL_PHONE))
        assertTrue(permissions.contains(Manifest.permission.READ_PHONE_STATE))
    }
}
