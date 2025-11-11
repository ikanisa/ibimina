package com.ibimina.client.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.usecase.GetGroupsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for group operations
 */
@HiltViewModel
class GroupViewModel @Inject constructor(
    private val getGroupsUseCase: GetGroupsUseCase
) : ViewModel() {
    
    private val _groupsState = MutableStateFlow<GroupUiState>(GroupUiState.Loading)
    val groupsState: StateFlow<GroupUiState> = _groupsState
    
    fun loadGroups(userId: String) {
        viewModelScope.launch {
            getGroupsUseCase(userId)
                .catch { e ->
                    _groupsState.value = GroupUiState.Error(e.message ?: "Unknown error")
                }
                .collect { groups ->
                    _groupsState.value = GroupUiState.Success(groups)
                }
        }
    }
}

sealed class GroupUiState {
    object Loading : GroupUiState()
    data class Success(val groups: List<Group>) : GroupUiState()
    data class Error(val message: String) : GroupUiState()
}
