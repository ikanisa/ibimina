package com.ibimina.staff.ui.ai

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ibimina.staff.R

@Composable
fun AiAssistantScreen(
    modifier: Modifier = Modifier,
    viewModel: AiAssistantViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = uiState.readiness?.message ?: "Checking OpenAI configuration…",
            style = MaterialTheme.typography.bodyMedium,
            color = if (uiState.readiness?.isReady == true) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            }
        )

        OutlinedTextField(
            value = uiState.prompt,
            onValueChange = viewModel::updatePrompt,
            label = { Text(text = stringResource(id = R.string.ai_assistant_prompt_label)) },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Send),
            keyboardActions = KeyboardActions(onSend = {
                viewModel.submitPrompt()
                focusManager.clearFocus()
            })
        )

        Button(
            onClick = {
                viewModel.submitPrompt()
                focusManager.clearFocus()
            },
            enabled = uiState.readiness?.isReady != false && !uiState.isLoading
        ) {
            Text(text = if (uiState.isLoading) "Sending…" else stringResource(id = R.string.ai_assistant_send_button))
        }

        uiState.errorMessage?.let { error ->
            Text(
                text = stringResource(id = R.string.ai_assistant_error_prefix, error),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        if (uiState.isLoading) {
            CircularProgressIndicator()
        }

        uiState.latestResponse?.let { response ->
            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = stringResource(id = R.string.ai_assistant_last_response_title),
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = response,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}
