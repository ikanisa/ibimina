package com.ibimina.client.ui.navigation

import androidx.compose.material3.Text
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.ibimina.client.ui.theme.IbiminaClientTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AppNavHostTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun navigationBarNavigatesBetweenDestinations() {
        composeTestRule.setContent {
            IbiminaClientTheme {
                AppNavHost(
                    dashboardScreen = { Text("Dashboard Screen") },
                    qrScannerScreen = { Text("QR Screen") },
                    smsTriageScreen = { Text("SMS Screen") },
                    assistantScreen = { Text("Assistant Screen") }
                )
            }
        }

        composeTestRule.onNodeWithText("Dashboard Screen").assertIsDisplayed()

        composeTestRule.onNodeWithContentDescription("QR Scanner").performClick()
        composeTestRule.onNodeWithText("QR Screen").assertIsDisplayed()

        composeTestRule.onNodeWithContentDescription("SMS Triage").performClick()
        composeTestRule.onNodeWithText("SMS Screen").assertIsDisplayed()

        composeTestRule.onNodeWithContentDescription("AI Assistant").performClick()
        composeTestRule.onNodeWithText("Assistant Screen").assertIsDisplayed()
    }
}
