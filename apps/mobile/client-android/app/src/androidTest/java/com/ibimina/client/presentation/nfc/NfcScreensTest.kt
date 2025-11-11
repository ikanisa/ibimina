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

        override fun readNFCTag(intent: Intent): String? = "member-123"

        override fun isNfcAvailable(): Boolean = true

        override fun isNfcEnabled(): Boolean = true
    }

    @Test
    fun nfcScanScreenShowsSuccessMessage() {
        val viewModel = NfcViewModel(fakeManager)
        composeRule.setContent {
            NfcScanScreen(viewModel = viewModel)
        }
        composeRule.runOnIdle {
            viewModel.readFromIntent(Intent())
        }
        composeRule.onNodeWithText("Last read payload: member-123").assertIsDisplayed()
    }

    @Test
    fun nfcWriteScreenShowsSuccessMessage() {
        val viewModel = NfcViewModel(fakeManager)
        composeRule.setContent {
            NfcWriteScreen(viewModel = viewModel)
        }
        composeRule.runOnIdle {
            viewModel.onNewTag(createMockTag())
        }
        composeRule.onNodeWithText("Payload").performTextReplacement("payment-success")
        composeRule.onNodeWithText("Write to tag").performClick()
        composeRule.onNodeWithText("Last written payload: payment-success").assertIsDisplayed()
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
