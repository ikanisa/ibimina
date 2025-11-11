package com.ibimina.client.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.Group
import com.ibimina.client.data.SupabaseClient
import com.ibimina.client.data.Transaction
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isLoading = true))
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh(userId: String = DEFAULT_USER_ID) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val groups = if (supabaseClient.isConfigured) {
                    supabaseClient.getUserGroups(userId)
                } else {
                    SAMPLE_GROUPS
                }
                val transactions = if (supabaseClient.isConfigured) {
                    supabaseClient.getTransactions(userId)
                } else {
                    SAMPLE_TRANSACTIONS
                }
                _uiState.update {
                    it.copy(
                        groups = groups,
                        transactions = transactions,
                        isLoading = false
                    )
                }
            } catch (cancellation: CancellationException) {
                throw cancellation
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.localizedMessage ?: "Unknown error"
                    )
                }
            }
        }
    }

    companion object {
        private const val DEFAULT_USER_ID = "demo-user"

        private val SAMPLE_GROUPS = listOf(
            Group(id = "1", name = "Ibimina Savings", group_id = "G1", member_code = "MEM-01"),
            Group(id = "2", name = "Wedding Committee", group_id = "G2", member_code = "MEM-02")
        )

        private val SAMPLE_TRANSACTIONS = listOf(
            Transaction(id = "T1", amount = 20.0, reference = "Savings", status = "completed", created_at = "2024-01-01"),
            Transaction(id = "T2", amount = 35.0, reference = "Event", status = "pending", created_at = "2024-01-05")
        )
    }
}

data class DashboardUiState(
    val groups: List<Group> = emptyList(),
    val transactions: List<Transaction> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
