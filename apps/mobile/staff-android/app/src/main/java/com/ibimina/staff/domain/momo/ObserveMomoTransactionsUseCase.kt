package com.ibimina.staff.domain.momo

import com.ibimina.staff.data.momo.MomoTransactionRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ObserveMomoTransactionsUseCase @Inject constructor(
    private val repository: MomoTransactionRepository
) {
    private val timeFormatter = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())

    operator fun invoke(): Flow<List<MomoTransactionUiState>> {
        return repository.transactions.map { transactions ->
            transactions
                .sortedByDescending { it.timestamp }
                .map { transaction ->
                    val amountLabel = formatAmount(transaction.amount, transaction.provider)
                    val senderLabel = transaction.senderPhone?.let { "From $it" } ?: "Unknown sender"
                    MomoTransactionUiState(
                        id = transaction.reference + transaction.timestamp,
                        providerLabel = transaction.provider.uppercase(Locale.getDefault()),
                        amountLabel = amountLabel,
                        reference = transaction.reference,
                        senderLabel = senderLabel,
                        displayTime = timeFormatter.format(Date(transaction.timestamp)),
                        rawMessage = transaction.messageBody
                    )
                }
        }
    }

    private fun formatAmount(amount: Double, provider: String): String {
        val formatted = String.format(Locale.getDefault(), "%,.2f", amount)
        return "${provider.uppercase(Locale.getDefault())} RWF $formatted"
    }
}
