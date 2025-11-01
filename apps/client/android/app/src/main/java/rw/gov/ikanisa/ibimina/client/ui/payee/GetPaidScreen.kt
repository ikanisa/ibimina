package rw.gov.ikanisa.ibimina.client.ui.payee

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.NumberFormat
import java.util.Locale
import java.util.UUID
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import rw.gov.ikanisa.ibimina.client.auth.PaymentPayload
import rw.gov.ikanisa.ibimina.client.auth.PaymentPayloadSigner
import rw.gov.ikanisa.ibimina.client.data.transactions.TransactionEntity
import rw.gov.ikanisa.ibimina.client.data.transactions.TransactionRepository
import rw.gov.ikanisa.ibimina.client.nfc.PayeeCardService

private const val CARD_TTL_SECONDS = 120

@Composable
fun GetPaidScreen(
    activity: FragmentActivity,
    deviceId: String,
    userId: String,
    repository: TransactionRepository,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val signer = remember(activity, deviceId, userId) { PaymentPayloadSigner(activity, deviceId, userId) }

    var merchantAccount by remember { mutableStateOf(TextFieldValue("")) }
    var merchantName by remember { mutableStateOf(TextFieldValue("")) }
    var amountInput by remember { mutableStateOf(TextFieldValue("")) }
    var note by remember { mutableStateOf(TextFieldValue("")) }

    val activePayload by PayeeCardService.activePayloadFlow().collectAsState(initial = null)
    val transactions by repository.transactions.collectAsState(initial = emptyList())

    var remainingSeconds by remember { mutableStateOf(0L) }

    LaunchedEffect(activePayload) {
        if (activePayload == null) {
            remainingSeconds = 0
        } else {
            while (true) {
                val current = activePayload
                if (current == null) {
                    remainingSeconds = 0
                    break
                }
                val remaining = current.remainingSeconds()
                remainingSeconds = remaining
                if (remaining <= 0) {
                    PayeeCardService.clearActivePayload("ttl elapsed")
                    break
                }
                delay(1_000)
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = modifier
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Get Paid",
                style = MaterialTheme.typography.headlineMedium
            )

            AssistChip(
                onClick = {},
                enabled = false,
                label = {
                    if (activePayload != null && remainingSeconds > 0) {
                        Text("Card armed • ${remainingSeconds}s remaining")
                    } else {
                        Text("Card idle")
                    }
                },
                leadingIcon = {
                    if (activePayload != null && remainingSeconds > 0) {
                        Icon(Icons.Default.LockOpen, contentDescription = null)
                    } else {
                        Icon(Icons.Default.Lock, contentDescription = null)
                    }
                }
            )

            Text(
                text = if (activePayload != null && remainingSeconds > 0) {
                    "Keep the device unlocked and near the reader. Payload expires when the timer reaches zero."
                } else {
                    "Fill in merchant details to arm your NFC card with a signed payout." }
            )

            OutlinedTextField(
                value = merchantName,
                onValueChange = { merchantName = it },
                label = { Text("Merchant Name") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = merchantAccount,
                onValueChange = { merchantAccount = it },
                label = { Text("Merchant Account / Till") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = amountInput,
                onValueChange = { amountInput = it },
                label = { Text("Amount") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Reference (optional)") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    coroutineScope.launch {
                        val amountMinor = parseAmountMinor(amountInput.text)
                        if (amountMinor == null) {
                            snackbarHostState.showSnackbar("Enter a valid amount")
                            return@launch
                        }

                        val now = System.currentTimeMillis()
                        val nonce = UUID.randomUUID().toString()
                        val nonceAccepted = repository.registerNonce(nonce, now)
                        if (!nonceAccepted) {
                            snackbarHostState.showSnackbar("Nonce collision detected, try again")
                            return@launch
                        }

                        val payload = PaymentPayload(
                            merchantAccount = merchantAccount.text.trim(),
                            merchantName = merchantName.text.trim(),
                            amountMinor = amountMinor,
                            currency = DEFAULT_CURRENCY,
                            note = note.text.takeIf { it.isNotBlank() },
                            nonce = nonce,
                            issuedAtMillis = now,
                            expiresAtMillis = now + CARD_TTL_SECONDS * 1000L
                        )

                        signer.sign(
                            payload = payload,
                            onSuccess = { active ->
                                coroutineScope.launch {
                                    PayeeCardService.arm(active)
                                    repository.recordTransaction(active)
                                    snackbarHostState.showSnackbar("Card armed for ${payload.merchantName}")
                                    merchantName = TextFieldValue("")
                                    merchantAccount = TextFieldValue("")
                                    amountInput = TextFieldValue("")
                                    note = TextFieldValue("")
                                }
                            },
                            onError = { error ->
                                coroutineScope.launch {
                                    repository.releaseNonce(nonce)
                                    snackbarHostState.showSnackbar(error)
                                }
                            }
                        )
                    }
                },
                enabled = remainingSeconds <= 0,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Arm Virtual Card")
            }

            if (transactions.isNotEmpty()) {
                Text(
                    text = "Recent Payouts",
                    style = MaterialTheme.typography.titleMedium
                )
                TransactionHistoryList(transactions)
            }
        }
    }
}

@Composable
private fun TransactionHistoryList(transactions: List<TransactionEntity>) {
    val formatter = remember { NumberFormat.getCurrencyInstance(Locale.getDefault()) }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(transactions, key = { it.id }) { transaction ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = transaction.merchantName, style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(4.dp))
                    formatter.currency = java.util.Currency.getInstance(transaction.currency)
                    val amount = formatter.format(transaction.amountMinor / 100.0)
                    Text(text = amount, style = MaterialTheme.typography.bodyLarge)
                    Spacer(Modifier.height(4.dp))
                    Text(text = "Nonce: ${transaction.nonce}", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

private fun parseAmountMinor(input: String): Long? {
    if (input.isBlank()) return null
    return try {
        BigDecimal(input.trim()).setScale(2, RoundingMode.HALF_UP)
            .movePointRight(2)
            .longValueExact()
    } catch (t: Throwable) {
        null
    }
}

private const val DEFAULT_CURRENCY = "RWF"
