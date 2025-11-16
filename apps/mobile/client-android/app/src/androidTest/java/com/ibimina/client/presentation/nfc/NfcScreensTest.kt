package com.ibimina.client.presentation.nfc

import android.app.Activity
import android.content.Intent
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.ibimina.client.data.nfc.NFCManager
import com.ibimina.client.domain.model.NFCPayload
import com.ibimina.client.security.PayloadSigner
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NfcScreensTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    private val fakeManager = object : NFCManager() {
        var lastWritten: String? = null

        override fun initialize(activity: Activity) {}

        override fun enableForegroundDispatch(activity: Activity) {}

        override fun disableForegroundDispatch(activity: Activity) {}

        override fun writeNFCTag(tag: Tag, data: String): Boolean {
            lastWritten = data
            return true
        }

        override fun readNFCTag(intent: Intent): String? =
            samplePayload().toJson()

        override fun isNfcAvailable(): Boolean = true

        override fun isNfcEnabled(): Boolean = true
    }

    @Test
    fun nfcScanScreenShowsSuccessMessage() {
        val viewModel = NfcViewModel(fakeManager, null)
        composeRule.setContent {
            NfcScanScreen(viewModel = viewModel)
        }
        composeRule.runOnIdle {
            viewModel.readFromIntent(Intent())
        }
        composeRule.onNodeWithText("Signature verified").assertIsDisplayed()
    }

    @Test
    fun nfcWriteScreenShowsSuccessMessage() {
        val viewModel = NfcViewModel(fakeManager, null)
        composeRule.setContent {
            NfcWriteScreen(viewModel = viewModel)
        }
        composeRule.runOnIdle {
            viewModel.onNewTag(createMockTag())
        }
        composeRule.onNodeWithText("Payload").performTextReplacement(samplePayload().toJson())
        composeRule.onNodeWithText("Write to tag").performClick()
        composeRule.onNodeWithText("Successfully wrote to tag").assertIsDisplayed()
    }

    private fun createMockTag(): Tag {
        val createMockTagMethod = Tag::class.java.getDeclaredMethod(
            "createMockTag",
            ByteArray::class.java,
            IntArray::class.java,
            Array<Bundle>::class.java
        )
        createMockTagMethod.isAccessible = true
        val techList = intArrayOf()
        val techExtras = emptyArray<Bundle>()
        return createMockTagMethod.invoke(null, byteArrayOf(0x04, 0x00), techList, techExtras) as Tag
    }
}
    private fun samplePayload(): NFCPayload =
        PayloadSigner.createSignedPayload(
            merchantId = "demo",
            network = "MTN",
            amount = 1000.0,
            reference = "REF123"
        )

