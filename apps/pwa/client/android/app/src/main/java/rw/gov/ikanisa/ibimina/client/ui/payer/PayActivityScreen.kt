package rw.gov.ikanisa.ibimina.client.ui.payer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import com.tapmomo.feature.R
import com.tapmomo.feature.data.models.PaymentPayload
import com.tapmomo.feature.data.models.SimInfo

@Composable
fun PayActivityScreen(
    state: PayUiState,
    onClose: () -> Unit,
    onStartScan: () -> Unit,
    onCancelConfirmation: () -> Unit,
    onConfirmPayment: (Int?) -> Unit,
    onSimSelected: (Int?) -> Unit,
    onOpenNfcSettings: () -> Unit,
    onResultClosed: () -> Unit,
    onMarkSettled: () -> Unit,
    onMarkFailed: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = stringResource(id = R.string.tapmomo_pay_title)) },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = null)
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            state.errorMessage?.let { error ->
                ErrorCard(message = error)
                Spacer(modifier = Modifier.height(16.dp))
            }

            state.warningMessage?.let { warning ->
                WarningCard(message = warning)
                Spacer(modifier = Modifier.height(16.dp))
            }

            when {
                !state.isNfcAvailable -> {
                    Text(
                        text = stringResource(id = R.string.tapmomo_error_nfc_unavailable),
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    TextButton(onClick = onClose) {
                        Text(text = stringResource(id = R.string.tapmomo_close))
                    }
                }

                !state.isNfcEnabled -> {
                    Text(
                        text = stringResource(id = R.string.tapmomo_error_nfc_disabled),
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onOpenNfcSettings) {
                        Text(text = stringResource(id = R.string.tapmomo_settings_nfc_enable))
                    }
                }

                state.isScanning -> {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = stringResource(id = R.string.tapmomo_pay_scanning))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(id = R.string.tapmomo_pay_scan_message),
                        textAlign = TextAlign.Center
                    )
                }

                else -> {
                    Text(
                        text = stringResource(id = R.string.tapmomo_pay_scan_message),
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onStartScan) {
                        Text(text = stringResource(id = R.string.tapmomo_role_pay))
                    }
                }
            }
        }
    }

    state.confirmationPayload?.let { payload ->
        PaymentConfirmationDialog(
            payload = payload,
            selectedSimId = state.selectedSimId,
            simCards = state.simCards,
            needsSimPermission = state.needsSimPermission,
            warningMessage = state.warningMessage,
            onSimSelected = onSimSelected,
            onConfirm = { onConfirmPayment(state.selectedSimId) },
            onDismiss = onCancelConfirmation
        )
    }

    state.result?.let { result ->
        PaymentResultDialog(
            result = result,
            onClose = onResultClosed,
            onMarkSettled = onMarkSettled,
            onReportIssue = onMarkFailed
        )
    }
}

@Composable
private fun ErrorCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            color = MaterialTheme.colorScheme.onErrorContainer,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun WarningCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            color = MaterialTheme.colorScheme.onTertiaryContainer,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun PaymentConfirmationDialog(
    payload: PaymentPayload,
    simCards: List<SimInfo>,
    selectedSimId: Int?,
    needsSimPermission: Boolean,
    warningMessage: String?,
    onSimSelected: (Int?) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = stringResource(id = R.string.tapmomo_pay_confirm_title))
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                val amount = payload.amount
                val message = if (amount != null) {
                    stringResource(
                        id = R.string.tapmomo_pay_confirm_message,
                        amount,
                        payload.currency,
                        payload.merchantId,
                        payload.network
                    )
                } else {
                    stringResource(
                        id = R.string.tapmomo_pay_confirm_message_no_amount,
                        payload.merchantId,
                        payload.network
                    )
                }
                Text(text = message)

                warningMessage?.let { warning ->
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = warning,
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (needsSimPermission) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = stringResource(id = R.string.tapmomo_pay_sim_permission_hint),
                        color = MaterialTheme.colorScheme.error
                    )
                } else if (simCards.size > 1) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = stringResource(id = R.string.tapmomo_pay_sim_picker_title))
                    Spacer(modifier = Modifier.height(8.dp))
                    simCards.forEach { sim ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            androidx.compose.material3.RadioButton(
                                selected = selectedSimId == sim.subscriptionId,
                                onClick = { onSimSelected(sim.subscriptionId) }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(text = sim.displayName, fontWeight = FontWeight.SemiBold)
                                Text(
                                    text = sim.carrierName,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text(text = stringResource(id = R.string.tapmomo_pay_confirm_button))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = stringResource(id = R.string.tapmomo_pay_cancel_button))
            }
        }
    )
}

@Composable
private fun PaymentResultDialog(
    result: PaymentResultUi,
    onClose: () -> Unit,
    onMarkSettled: () -> Unit,
    onReportIssue: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onClose,
        title = {
            Text(
                text = when (result.status) {
                    "settled" -> stringResource(id = R.string.tapmomo_result_success_title)
                    "failed" -> stringResource(id = R.string.tapmomo_result_error_title)
                    else -> stringResource(id = R.string.tapmomo_result_pending_title)
                }
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(text = result.message)
                Spacer(modifier = Modifier.height(8.dp))
                result.amount?.let { amount ->
                    Text(
                        text = stringResource(
                            id = R.string.tapmomo_history_item_amount,
                            amount,
                            result.currency
                        ),
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(id = R.string.tapmomo_history_item_merchant, result.merchantId),
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(id = R.string.tapmomo_result_status_label, result.status.uppercase()),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            Button(onClick = onMarkSettled) {
                Text(text = stringResource(id = R.string.tapmomo_result_mark_settled))
            }
        },
        dismissButton = {
            Column(horizontalAlignment = Alignment.End) {
                TextButton(onClick = onReportIssue) {
                    Text(text = stringResource(id = R.string.tapmomo_result_report_issue))
                }
                TextButton(onClick = onClose) {
                    Text(text = stringResource(id = R.string.tapmomo_close))
                }
            }
        }
    )
}
