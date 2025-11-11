package com.ibimina.client.presentation.nfc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

@Composable
fun NfcScanScreen(viewModel: NfcViewModel) {
    val context = LocalContext.current
    val activity = context as Activity
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.initialize(activity)
        activity.intent?.let { intent ->
            viewModel.readFromIntent(intent)
            intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)?.let(viewModel::onNewTag)
        }
    }

    DisposableEffect(Unit) {
        viewModel.enableForegroundDispatch(activity)
        onDispose { viewModel.disableForegroundDispatch(activity) }
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Scan NFC Tag",
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
            state.lastReadPayload?.let { payload ->
                Text(
                    text = "Last read payload: $payload",
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(vertical = 16.dp)
                )
            }
            Button(onClick = { viewModel.readFromIntent(activity.intent) }) {
                Text(text = "Read from tag")
            }
        }
    }
}
