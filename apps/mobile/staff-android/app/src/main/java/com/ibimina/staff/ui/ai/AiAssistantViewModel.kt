package com.ibimina.staff.ui.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.staff.service.OpenAIReadiness
import com.ibimina.staff.service.OpenAIService
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AiAssistantUiState(
    val prompt: String = "",
    val readiness: OpenAIReadiness? = null,
    val isLoading: Boolean = false,
    val latestResponse: String? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class AiAssistantViewModel @Inject constructor(
    private val openAIService: OpenAIService
) : ViewModel() {
    private val _uiState = MutableStateFlow(AiAssistantUiState())
    val uiState: StateFlow<AiAssistantUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            openAIService.readiness().collect { readiness ->
                _uiState.update { it.copy(readiness = readiness) }
            }
        }
    }

    fun updatePrompt(prompt: String) {
        _uiState.update { it.copy(prompt = prompt) }
    }

    fun submitPrompt() {
        val prompt = _uiState.value.prompt.trim()
        if (prompt.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Prompt cannot be empty") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = openAIService.sendPrompt(prompt)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    latestResponse = result.getOrNull() ?: it.latestResponse,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }
}
