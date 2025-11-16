package com.ibimina.client.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.auth.AuthRepository
import com.ibimina.client.data.auth.AuthState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface AuthStep {
    data object PhoneEntry : AuthStep
    data class OtpEntry(val phoneNumber: String) : AuthStep
}

data class OnboardingUiState(
    val step: AuthStep = AuthStep.PhoneEntry,
    val phoneNumber: String = "",
    val otpCode: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val authState: StateFlow<AuthState> = authRepository.authState.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = AuthState.Loading
    )

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()

    fun updatePhoneNumber(value: String) {
        _uiState.update { it.copy(phoneNumber = value.filterNot(Char::isWhitespace)) }
    }

    fun updateOtpCode(value: String) {
        _uiState.update { it.copy(otpCode = value.filter(Char::isDigit).take(6)) }
    }

    fun submitPhoneNumber() {
        val phone = _uiState.value.phoneNumber
        if (phone.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Enter your WhatsApp number") }
            return
        }
        sendOtp(phone)
    }

    fun verifyCode() {
        val state = _uiState.value
        if (state.otpCode.length != 6) {
            _uiState.update { it.copy(errorMessage = "Enter the 6-digit code") }
            return
        }
        val phone = when (val step = state.step) {
            is AuthStep.OtpEntry -> step.phoneNumber
            AuthStep.PhoneEntry -> state.phoneNumber
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching { authRepository.verifyOtp(phone, state.otpCode) }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Verification failed"
                        )
                    }
                }
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, errorMessage = null) }
                }
        }
    }

    fun resendCode() {
        val phone = when (val step = _uiState.value.step) {
            is AuthStep.OtpEntry -> step.phoneNumber
            AuthStep.PhoneEntry -> _uiState.value.phoneNumber
        }
        if (phone.isNotBlank()) {
            sendOtp(phone)
        }
    }

    fun goBackToPhoneEntry() {
        _uiState.update { OnboardingUiState(phoneNumber = it.phoneNumber) }
    }

    private fun sendOtp(phoneNumber: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching { authRepository.sendOtp(phoneNumber) }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Unable to send verification code"
                        )
                    }
                }
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = null,
                            step = AuthStep.OtpEntry(phoneNumber = phoneNumber)
                        )
                    }
                }
        }
    }
}
