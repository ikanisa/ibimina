package com.ibimina.client.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.ChatMessage
import com.ibimina.client.data.ChatRole
import com.ibimina.client.data.OpenAIService
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class AssistantViewModel @Inject constructor(
    private val openAIService: OpenAIService
) : ViewModel() {

    private val _uiState = MutableStateFlow(AssistantUiState())
    val uiState: StateFlow<AssistantUiState> = _uiState.asStateFlow()

    fun sendMessage(content: String) {
        if (content.isBlank()) return

        val newUserMessage = ChatMessage(role = ChatRole.USER, content = content)
        val history = _uiState.value.messages + newUserMessage
        _uiState.update {
            it.copy(messages = history, isLoading = true, input = "", error = null)
        }

        viewModelScope.launch {
            val response = try {
                openAIService.sendMessage(history)
            } catch (exception: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = exception.localizedMessage ?: "Unknown error")
                }
                return@launch
            }

            _uiState.update {
                it.copy(
                    messages = it.messages + response,
                    isLoading = false,
                    error = null
                )
            }
        }
    }

    fun updateInput(value: String) {
        _uiState.update { it.copy(input = value) }
    }
}

data class AssistantUiState(
    val messages: List<ChatMessage> = emptyList(),
    val input: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)
