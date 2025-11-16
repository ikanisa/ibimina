package com.ibimina.client.presentation.nfc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

@Composable
fun NfcWriteScreen(viewModel: NfcViewModel) {
    val context = LocalContext.current
    val activity = context as Activity
    val state by viewModel.uiState.collectAsState()
    var payload by rememberSaveable(state.memberId) { mutableStateOf(state.lastWrittenPayload ?: state.memberId.orEmpty()) }

    LaunchedEffect(state.memberId, state.lastWrittenPayload) {
        when {
            state.lastWrittenPayload != null && payload != state.lastWrittenPayload ->
                payload = state.lastWrittenPayload
            state.lastWrittenPayload == null && state.memberId != null && payload.isBlank() ->
                payload = state.memberId
        }
    }

    LaunchedEffect(Unit) {
        viewModel.initialize(activity)
        activity.intent?.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)?.let(viewModel::onNewTag)
    }

    DisposableEffect(Unit) {
        viewModel.enableForegroundDispatch(activity)
        onDispose { viewModel.disableForegroundDispatch(activity) }
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Write NFC Tag",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            state.infoMessage?.let {
                Text(text = it, style = MaterialTheme.typography.bodyMedium)
            }
            state.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            OutlinedTextField(
                value = payload,
                onValueChange = { payload = it },
                label = { Text("Payload") },
                modifier = Modifier.padding(vertical = 16.dp)
            )
            Button(onClick = { viewModel.writeToTag(payload) }) {
                Text(text = "Write to tag")
            }
            state.lastWrittenPayload?.let { written ->
                Text(
                    text = "Last written payload: $written",
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(vertical = 16.dp)
                )
            }
        }
    }
}
