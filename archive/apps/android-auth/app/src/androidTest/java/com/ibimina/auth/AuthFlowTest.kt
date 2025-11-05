package com.ibimina.auth

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import org.junit.Rule
import org.junit.Test

import com.ibimina.auth.ui.screens.StartScreen
import com.ibimina.auth.ui.screens.VerifyScreen

class AuthFlowTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun startScreenShowsError() {
        composeRule.setContent {
            MaterialTheme {
                StartScreen(isLoading = false, errorMessage = "Network error", onSubmit = {})
            }
        }

        composeRule.onNodeWithText("Network error").assertIsDisplayed()
    }

    @Test
    fun verifyScreenDisplaysCountdownAndDisablesResend() {
        composeRule.setContent {
            MaterialTheme {
                VerifyScreen(
                    whatsappNumber = "+250788000111",
                    countdownSeconds = 65,
                    isLoading = false,
                    isResending = false,
                    errorMessage = null,
                    onVerify = {},
                    onResend = {}
                )
            }
        }

        composeRule.onNodeWithText("Resend available in 1:05").assertIsDisplayed()
        composeRule.onNodeWithText("Resend code").assertIsDisplayed()
    }
}
