package com.ibimina.client.presentation.dashboard

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
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: IbiminaRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private var currentMemberId: String? = null

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        observeData()
    }

    private fun observeData() {
        viewModelScope.launch {
            authRepository.memberIdFlow.collectLatest { memberId ->
                currentMemberId = memberId
                refresh()
                combine(
                    repository.observeGroups(memberId),
                    repository.observeTransactions(memberId)
                ) { groups, transactions ->
                    val totalSaved = transactions.sumOf { it.amount }
                    DashboardUiState(
                        isLoading = false,
                        groupCount = groups.size,
                        totalSaved = totalSaved,
                        latestTransaction = transactions.firstOrNull(),
                        errorMessage = null
                    )
                }
                    .onStart { emit(DashboardUiState(isLoading = true)) }
                    .catch { throwable ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = throwable.message ?: "Unable to load data"
                        )
                    }
                    .collect { state -> _uiState.value = state }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                currentMemberId?.let {
                    repository.refreshGroups(it)
                    repository.refreshTransactions(it)
                }
            } catch (error: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: "Failed to refresh data"
                )
            }
        }
    }
}
