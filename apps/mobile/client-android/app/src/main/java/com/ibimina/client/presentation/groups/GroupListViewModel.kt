package com.ibimina.client.presentation.groups

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.domain.repository.IbiminaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch

@HiltViewModel
class GroupListViewModel @Inject constructor(
    private val repository: IbiminaRepository
) : ViewModel() {

    private val userId = "demo-user"

    private val _uiState = MutableStateFlow(GroupListUiState())
    val uiState: StateFlow<GroupListUiState> = _uiState.asStateFlow()

    init {
        observeGroups()
        refresh()
    }

    private fun observeGroups() {
        viewModelScope.launch {
            repository.observeGroups(userId)
                .onStart { _uiState.value = GroupListUiState(isLoading = true) }
                .catch { throwable ->
                    _uiState.value = GroupListUiState(
                        isLoading = false,
                        errorMessage = throwable.message ?: "Unable to load groups"
                    )
                }
                .collect { groups ->
                    _uiState.value = GroupListUiState(
                        isLoading = false,
                        groups = groups
                    )
                }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refreshGroups(userId)
            } catch (error: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: "Failed to refresh groups"
                )
            }
        }
    }
}
