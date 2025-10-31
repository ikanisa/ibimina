package com.tapmomo.feature.ui.screens

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.tapmomo.feature.R
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.core.SimUtils
import com.tapmomo.feature.data.TapMoMoRepository
import com.tapmomo.feature.data.models.PaymentPayload
import com.tapmomo.feature.nfc.PayloadValidator
import com.tapmomo.feature.nfc.ReaderController
import com.tapmomo.feature.nfc.ValidationResult
import com.tapmomo.feature.ussd.UssdLauncher
import kotlinx.coroutines.launch

/**
 * Screen for making payments (payer mode)
 */
@Composable
fun PayScreen(
    onClose: () -> Unit = {}
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val scope = rememberCoroutineScope()
    
    var isScanning by remember { mutableStateOf(false) }
    var scannedPayload by remember { mutableStateOf<PaymentPayload?>(null) }
    var showConfirmDialog by remember { mutableStateOf(false) }
    var showSimPicker by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var paymentLaunched by remember { mutableStateOf(false) }
    
    // NFC reader
    val readerController = remember(activity) {
        activity?.let { ReaderController(it) }
    }
    
    // Repository and validator
    val repository = remember { TapMoMoRepository(context) }
    val validator = remember { PayloadValidator(repository) }
    
    // Check NFC
    val nfcAvailable = TapMoMo.isNfcAvailable(context)
    val nfcEnabled = TapMoMo.isNfcEnabled(context)
    
    // Start/stop reader mode
    LaunchedEffect(isScanning) {
        if (isScanning && readerController != null) {
            readerController.enableReaderMode { payload ->
                if (payload != null) {
                    scope.launch {
                        when (val result = validator.validate(payload)) {
                            is ValidationResult.Valid -> {
                                scannedPayload = payload
                                showConfirmDialog = true
                                isScanning = false
                            }
                            is ValidationResult.UnsignedWarning -> {
                                scannedPayload = payload
                                // Show warning, but allow to proceed
                                showConfirmDialog = true
                                isScanning = false
                            }
                            is ValidationResult.Invalid -> {
                                errorMessage = result.reason
                                isScanning = false
                            }
                        }
                    }
                }
            }
        } else {
            readerController?.disableReaderMode()
        }
    }
    
    DisposableEffect(Unit) {
        onDispose {
            readerController?.disableReaderMode()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.tapmomo_pay_title)) },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Text("✕")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Error message
            errorMessage?.let { error ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = error,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            if (!nfcAvailable || !nfcEnabled) {
                Text(
                    text = if (!nfcAvailable) {
                        stringResource(R.string.tapmomo_error_nfc_unavailable)
                    } else {
                        stringResource(R.string.tapmomo_error_nfc_disabled)
                    },
                    color = MaterialTheme.colorScheme.error
                )
                return@Scaffold
            }
            
            if (paymentLaunched) {
                // Payment launched state
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = stringResource(R.string.tapmomo_pay_ussd_launched),
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(stringResource(R.string.tapmomo_pay_ussd_complete_message))
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onClose) {
                    Text(stringResource(R.string.tapmomo_close))
                }
            } else if (isScanning) {
                // Scanning state
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(R.string.tapmomo_pay_scanning))
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.tapmomo_pay_scan_message),
                    style = MaterialTheme.typography.bodyMedium
                )
            } else {
                // Ready to scan
                Button(
                    onClick = { isScanning = true }
                ) {
                    Text("Start Scanning")
                }
            }
        }
        
        // Confirm payment dialog
        if (showConfirmDialog && scannedPayload != null) {
            PaymentConfirmDialog(
                payload = scannedPayload!!,
                onConfirm = { selectedSimId ->
                    val success = UssdLauncher.launchUssd(
                        context = context,
                        network = try { com.tapmomo.feature.Network.valueOf(scannedPayload!!.network) } 
                                  catch (e: Exception) { com.tapmomo.feature.Network.MTN },
                        merchantId = scannedPayload!!.merchantId,
                        amount = scannedPayload!!.amount,
                        subscriptionId = selectedSimId
                    )
                    
                    if (success) {
                        paymentLaunched = true
                        showConfirmDialog = false
                    } else {
                        errorMessage = stringResource(R.string.tapmomo_error_ussd_failed)
                        showConfirmDialog = false
                    }
                },
                onDismiss = {
                    showConfirmDialog = false
                    scannedPayload = null
                }
            )
        }
    }
}

@Composable
private fun PaymentConfirmDialog(
    payload: PaymentPayload,
    onConfirm: (Int?) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val simCards = remember { SimUtils.getActiveSimCards(context) }
    var selectedSimId by remember { mutableStateOf<Int?>(simCards.firstOrNull()?.subscriptionId) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.tapmomo_pay_confirm_title)) },
        text = {
            Column {
                Text(
                    stringResource(
                        R.string.tapmomo_pay_confirm_message,
                        payload.amount ?: 0,
                        payload.currency,
                        payload.merchantId,
                        payload.network
                    )
                )
                
                // SIM picker for dual-SIM
                if (simCards.size > 1) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(stringResource(R.string.tapmomo_pay_sim_picker_title))
                    simCards.forEach { sim ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedSimId == sim.subscriptionId,
                                onClick = { selectedSimId = sim.subscriptionId }
                            )
                            Text("${sim.displayName} (${sim.carrierName})")
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(selectedSimId) }) {
                Text(stringResource(R.string.tapmomo_pay_confirm_button))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.tapmomo_pay_cancel_button))
            }
        }
    )
}
