package com.ibimina.client.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.usecase.CreatePaymentUseCase
import com.ibimina.client.domain.usecase.GetPaymentsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for payment operations
 */
@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val getPaymentsUseCase: GetPaymentsUseCase,
    private val createPaymentUseCase: CreatePaymentUseCase
) : ViewModel() {
    
    private val _paymentsState = MutableStateFlow<PaymentUiState>(PaymentUiState.Loading)
    val paymentsState: StateFlow<PaymentUiState> = _paymentsState
    
    fun loadPayments(userId: String) {
        viewModelScope.launch {
            getPaymentsUseCase(userId)
                .catch { e ->
                    _paymentsState.value = PaymentUiState.Error(e.message ?: "Unknown error")
                }
                .collect { payments ->
                    _paymentsState.value = PaymentUiState.Success(payments)
                }
        }
    }
    
    fun createPayment(payment: Payment) {
        viewModelScope.launch {
            _paymentsState.value = PaymentUiState.Loading
            val result = createPaymentUseCase(payment)
            result.fold(
                onSuccess = { 
                    // Payment created successfully
                },
                onFailure = { e ->
                    _paymentsState.value = PaymentUiState.Error(e.message ?: "Failed to create payment")
                }
            )
        }
    }
}

sealed class PaymentUiState {
    object Loading : PaymentUiState()
    data class Success(val payments: List<Payment>) : PaymentUiState()
    data class Error(val message: String) : PaymentUiState()
}
