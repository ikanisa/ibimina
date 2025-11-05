package com.ibimina.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.ibimina.auth.api.StartWhatsAppResponse
import com.ibimina.auth.data.AuthRepository
import com.ibimina.auth.data.AuthScreen
import com.ibimina.auth.data.AuthUiState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val DEFAULT_RESEND_SECONDS = 60

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null

    init {
      viewModelScope.launch {
        val token = repository.loadToken()
        if (token != null) {
          _uiState.update {
            it.copy(
              currentScreen = AuthScreen.Complete,
              token = token,
              errorMessage = null
            )
          }
        }
      }
    }

    fun startAuth(whatsappNumber: String) {
        if (whatsappNumber.isBlank()) return
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            runCatching { repository.startAuth(whatsappNumber.trim()) }
                .onSuccess { response ->
                    transitionToVerify(whatsappNumber.trim(), response)
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Unable to send code"
                        )
                    }
                }
        }
    }

    fun verifyCode(code: String) {
        val state = _uiState.value
        if (code.isBlank() || state.isLoading || state.currentScreen != AuthScreen.Verify) {
            return
        }
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            runCatching {
                repository.verifyCode(state.whatsappNumber, code.trim(), state.attemptId)
            }.onSuccess { response ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        currentScreen = AuthScreen.Complete,
                        token = response.token,
                        errorMessage = null
                    )
                }
                countdownJob?.cancel()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Verification failed"
                    )
                }
            }
        }
    }

    fun resendCode() {
        val state = _uiState.value
        if (state.currentScreen != AuthScreen.Verify || state.isResending || state.countdownSeconds > 0) {
            return
        }
        _uiState.update { it.copy(isResending = true, errorMessage = null) }
        viewModelScope.launch {
            runCatching { repository.startAuth(state.whatsappNumber) }
                .onSuccess { response ->
                    _uiState.update { current ->
                        current.copy(
                            isResending = false,
                            attemptId = response.attemptId,
                            countdownSeconds = response.resendIn ?: DEFAULT_RESEND_SECONDS,
                            errorMessage = null
                        )
                    }
                    startCountdown(response.resendIn ?: DEFAULT_RESEND_SECONDS)
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isResending = false,
                            errorMessage = error.message ?: "Could not resend code"
                        )
                    }
                }
        }
    }

    private fun transitionToVerify(whatsappNumber: String, response: StartWhatsAppResponse) {
        _uiState.update {
            it.copy(
                currentScreen = AuthScreen.Verify,
                whatsappNumber = whatsappNumber,
                attemptId = response.attemptId,
                countdownSeconds = response.resendIn ?: DEFAULT_RESEND_SECONDS,
                isLoading = false,
                errorMessage = null
            )
        }
        startCountdown(response.resendIn ?: DEFAULT_RESEND_SECONDS)
    }

    private fun startCountdown(startAt: Int) {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            var remaining = startAt
            while (remaining > 0) {
                delay(1000)
                remaining -= 1
                _uiState.update { it.copy(countdownSeconds = remaining) }
            }
        }
    }

    class Factory(private val repository: AuthRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
                return AuthViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
