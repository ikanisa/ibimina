package com.ibimina.client.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ibimina.client.service.SmsMessage
import com.ibimina.client.service.SmsStatus
import com.ibimina.client.ui.viewmodel.SmsTriageViewModel

@Composable
fun SmsTriageRoute(
    viewModel: SmsTriageViewModel,
    modifier: Modifier = Modifier
) {
    val triageFeed by viewModel.triageFeed.collectAsStateWithLifecycle()
    SmsTriageScreen(
        messages = triageFeed,
        onHandled = viewModel::markHandled,
        modifier = modifier
    )
}

@Composable
fun SmsTriageScreen(
    messages: List<SmsMessage>,
    onHandled: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Mobile Money SMS Triage",
            style = MaterialTheme.typography.headlineSmall
        )
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(messages) { message ->
                Card(
                    colors = CardDefaults.cardColors(),
                    modifier = Modifier
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "From: ${message.sender}", style = MaterialTheme.typography.titleSmall)
                        Text(text = message.body, style = MaterialTheme.typography.bodyMedium)
                        Text(text = "Received: ${message.timestamp}", style = MaterialTheme.typography.bodySmall)
                        Text(text = "Status: ${message.status}", style = MaterialTheme.typography.bodySmall)
                        if (message.status == SmsStatus.Pending) {
                            Button(onClick = { onHandled(message.id) }) {
                                Text(text = "Mark as triaged")
                            }
                        }
                    }
                }
            }
        }
    }
}
