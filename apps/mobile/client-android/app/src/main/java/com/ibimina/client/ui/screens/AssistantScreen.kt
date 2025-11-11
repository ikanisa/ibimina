package com.ibimina.client.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ibimina.client.data.ChatMessage
import com.ibimina.client.data.ChatRole
import com.ibimina.client.ui.viewmodel.AssistantUiState
import com.ibimina.client.ui.viewmodel.AssistantViewModel

@Composable
fun AssistantRoute(
    viewModel: AssistantViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    AssistantScreen(
        state = uiState,
        onInputChanged = viewModel::updateInput,
        onSend = viewModel::sendMessage,
        modifier = modifier
    )
}

@Composable
fun AssistantScreen(
    state: AssistantUiState,
    onInputChanged: (String) -> Unit,
    onSend: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "AI Assistant", style = MaterialTheme.typography.headlineSmall)
        AssistantMessages(messages = state.messages, modifier = Modifier.weight(1f))
        if (state.isLoading) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator()
            }
        }
        state.error?.let { error ->
            Text(text = error, color = MaterialTheme.colorScheme.error)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = state.input,
                onValueChange = onInputChanged,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Ask about your ibimina activity") }
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = { onSend(state.input) },
                enabled = state.input.isNotBlank()
            ) {
                Icon(imageVector = Icons.Default.Send, contentDescription = "Send message")
            }
        }
        Button(
            onClick = { onSend(state.input) },
            enabled = state.input.isNotBlank()
        ) {
            Text(text = "Send")
        }
    }
}

@Composable
private fun AssistantMessages(
    messages: List<ChatMessage>,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(messages) { message ->
            Column(
                horizontalAlignment = if (message.role == ChatRole.USER) Alignment.End else Alignment.Start,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (message.role == ChatRole.USER) "You" else "Assistant",
                    fontWeight = FontWeight.Bold
                )
                Text(text = message.content, style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}
