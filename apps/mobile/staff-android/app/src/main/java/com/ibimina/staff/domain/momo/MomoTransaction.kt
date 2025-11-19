package com.ibimina.staff.domain.momo

data class MomoTransaction(
    val provider: String,
    val amount: Double,
    val reference: String,
    val senderPhone: String?,
    val timestamp: Long,
    val messageBody: String
)

data class MomoTransactionUiState(
    val id: String,
    val providerLabel: String,
    val amountLabel: String,
    val reference: String,
    val senderLabel: String,
    val displayTime: String,
    val rawMessage: String
)

data class SmsInboxUiState(
    val transactions: List<MomoTransactionUiState> = emptyList()
) {
    val isEmpty: Boolean get() = transactions.isEmpty()
}
