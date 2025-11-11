package com.ibimina.client.presentation.transactions

import com.ibimina.client.domain.model.Transaction

data class TransactionHistoryUiState(
    val isLoading: Boolean = true,
    val transactions: List<Transaction> = emptyList(),
    val errorMessage: String? = null
)
