package com.ibimina.auth.data

data class AuthUiState(
    val currentScreen: AuthScreen = AuthScreen.Start,
    val whatsappNumber: String = "",
    val attemptId: String = "",
    val countdownSeconds: Int = 0,
    val isLoading: Boolean = false,
    val isResending: Boolean = false,
    val errorMessage: String? = null,
    val token: String? = null
)

enum class AuthScreen {
    Start,
    Verify,
    Complete
}
