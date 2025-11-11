package com.ibimina.client.presentation.profile

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
class ProfileViewModel @Inject constructor(
    private val repository: IbiminaRepository
) : ViewModel() {

    private val userId = "demo-user"

    private val _uiState = MutableStateFlow(ProfileUiState(userId = userId))
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        observeGroups()
        refresh()
    }

    private fun observeGroups() {
        viewModelScope.launch {
            repository.observeGroups(userId)
                .onStart { _uiState.value = _uiState.value.copy(isLoading = true) }
                .catch { _ ->
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
                .collect { groups ->
                    _uiState.value = _uiState.value.copy(
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
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
}
