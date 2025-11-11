package com.ibimina.client.presentation.transactions

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun TransactionHistoryScreen(viewModel: TransactionHistoryViewModel) {
    val state by viewModel.uiState.collectAsState()

    Surface(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Transaction History",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            when {
                state.isLoading -> CircularProgressIndicator()
                state.errorMessage != null -> Text(
                    text = state.errorMessage ?: "",
                    color = MaterialTheme.colorScheme.error
                )
                else -> {
                    LazyColumn {
                        items(state.transactions) { transaction ->
                            Column(modifier = Modifier.padding(vertical = 12.dp)) {
                                Text(
                                    text = transaction.reference,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "Amount: ${transaction.amount}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Text(
                                    text = "Status: ${transaction.status} - ${transaction.createdAt}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
