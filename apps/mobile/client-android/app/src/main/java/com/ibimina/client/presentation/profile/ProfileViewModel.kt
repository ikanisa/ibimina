package com.ibimina.client.presentation.profile

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
class ProfileViewModel @Inject constructor(
    private val repository: IbiminaRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private var currentMemberId: String? = null

    private val _uiState = MutableStateFlow(ProfileUiState(userId = ""))
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        observeGroups()
    }

    private fun observeGroups() {
        viewModelScope.launch {
            authRepository.memberIdFlow.collectLatest { memberId ->
                currentMemberId = memberId
                _uiState.value = _uiState.value.copy(userId = memberId)
                refresh()
                repository.observeGroups(memberId)
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
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                currentMemberId?.let { repository.refreshGroups(it) }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
}
