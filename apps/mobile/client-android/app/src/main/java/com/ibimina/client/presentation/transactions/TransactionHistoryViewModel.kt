package com.ibimina.client.presentation.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.auth.AuthRepository
import com.ibimina.client.domain.repository.IbiminaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch

@HiltViewModel
class TransactionHistoryViewModel @Inject constructor(
    private val repository: IbiminaRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private var currentMemberId: String? = null

    private val _uiState = MutableStateFlow(TransactionHistoryUiState())
    val uiState: StateFlow<TransactionHistoryUiState> = _uiState.asStateFlow()

    init {
        observeTransactions()
    }

    private fun observeTransactions() {
        viewModelScope.launch {
            authRepository.memberIdFlow.collectLatest { memberId ->
                currentMemberId = memberId
                refresh()
                repository.observeTransactions(memberId)
                    .onStart { _uiState.value = TransactionHistoryUiState(isLoading = true) }
                    .catch { throwable ->
                        _uiState.value = TransactionHistoryUiState(
                            isLoading = false,
                            errorMessage = throwable.message ?: "Unable to load transactions"
                        )
                    }
                    .collect { transactions ->
                        _uiState.value = TransactionHistoryUiState(
                            isLoading = false,
                            transactions = transactions
                        )
                    }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                currentMemberId?.let { repository.refreshTransactions(it) }
            } catch (error: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: "Failed to refresh transactions"
                )
            }
        }
    }
}
