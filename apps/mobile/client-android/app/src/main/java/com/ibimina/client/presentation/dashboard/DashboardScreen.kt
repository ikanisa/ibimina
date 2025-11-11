package com.ibimina.client.presentation.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onScanTap: () -> Unit,
    onWriteTap: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(PaddingValues(24.dp)),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Welcome back",
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = "You belong to ${state.groupCount} groups",
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "Total contributions: ${"%.2f".format(state.totalSaved)}",
                style = MaterialTheme.typography.bodyLarge
            )
            state.latestTransaction?.let { transaction ->
                Text(
                    text = "Last transaction: ${transaction.reference} (${transaction.status})",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            state.errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            if (state.isLoading) {
                CircularProgressIndicator()
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onScanTap,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = "Scan NFC Card")
            }
            Button(
                onClick = onWriteTap,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = "Write NFC Card")
            }
        }
    }
}
