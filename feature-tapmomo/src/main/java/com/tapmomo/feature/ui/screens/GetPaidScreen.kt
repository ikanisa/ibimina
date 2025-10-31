package com.tapmomo.feature.ui.screens

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import com.tapmomo.feature.Network
import com.tapmomo.feature.R
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.core.TimeUtils
import com.tapmomo.feature.nfc.PayeeCardService
import com.tapmomo.feature.nfc.PayloadBuilder
import kotlinx.coroutines.delay

/**
 * Screen for receiving payments (payee/merchant mode)
 */
@Composable
fun GetPaidScreen(
    initialAmount: Int? = null,
    initialNetwork: Network = Network.MTN,
    initialMerchantId: String = "",
    onClose: () -> Unit = {}
) {
    val context = LocalContext.current
    val config = TapMoMo.getConfig()
    
    var amount by remember { mutableStateOf(initialAmount?.toString() ?: "") }
    var selectedNetwork by remember { mutableStateOf(initialNetwork) }
    var merchantId by remember { mutableStateOf(initialMerchantId) }
    var isNfcActive by remember { mutableStateOf(false) }
    var remainingTime by remember { mutableStateOf(0L) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    // Check NFC availability
    val nfcAvailable = TapMoMo.isNfcAvailable(context)
    val nfcEnabled = TapMoMo.isNfcEnabled(context)
    
    // Countdown timer
    LaunchedEffect(isNfcActive) {
        if (isNfcActive) {
            while (PayeeCardService.isPayloadActive()) {
                remainingTime = PayeeCardService.getRemainingTtl()
                delay(1000)
            }
            if (isNfcActive && remainingTime == 0L) {
                isNfcActive = false
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.tapmomo_get_paid_title)) },
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Error message
            errorMessage?.let { error ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = error,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
            
            if (!nfcAvailable) {
                ErrorCard(stringResource(R.string.tapmomo_error_nfc_unavailable))
                return@Scaffold
            }
            
            if (!nfcEnabled) {
                ErrorCard(stringResource(R.string.tapmomo_error_nfc_disabled))
                return@Scaffold
            }
            
            // Amount input
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text(stringResource(R.string.tapmomo_get_paid_amount_label)) },
                placeholder = { 
                    Text(stringResource(R.string.tapmomo_get_paid_amount_hint, config.defaultCurrency)) 
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                enabled = !isNfcActive
            )
            
            // Merchant ID input
            OutlinedTextField(
                value = merchantId,
                onValueChange = { merchantId = it },
                label = { Text(stringResource(R.string.tapmomo_get_paid_merchant_label)) },
                placeholder = { Text(stringResource(R.string.tapmomo_get_paid_merchant_hint)) },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isNfcActive
            )
            
            // Network selector
            Text(stringResource(R.string.tapmomo_get_paid_network_label))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                config.networks.forEach { network ->
                    FilterChip(
                        selected = selectedNetwork == network,
                        onClick = { if (!isNfcActive) selectedNetwork = network },
                        label = { Text(network.name) },
                        enabled = !isNfcActive
                    )
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Active NFC status
            if (isNfcActive) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = stringResource(R.string.tapmomo_get_paid_active_title),
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(stringResource(R.string.tapmomo_get_paid_active_message))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = stringResource(
                                R.string.tapmomo_get_paid_countdown,
                                remainingTime / 1000
                            ),
                            style = MaterialTheme.typography.headlineMedium
                        )
                    }
                }
            }
            
            // Activate/Deactivate button
            Button(
                onClick = {
                    if (isNfcActive) {
                        // Deactivate
                        PayeeCardService.clearPayload()
                        isNfcActive = false
                    } else {
                        // Activate
                        if (merchantId.isBlank()) {
                            errorMessage = "Merchant ID is required"
                            return@Button
                        }
                        
                        try {
                            val amountInt = amount.toIntOrNull()
                            val payload = PayloadBuilder.createPayload(
                                network = selectedNetwork,
                                merchantId = merchantId,
                                amount = amountInt,
                                merchantSecret = null // In real app, fetch from backend
                            )
                            
                            val payloadJson = PayloadBuilder.toJson(payload)
                            PayeeCardService.setPayload(payloadJson, config.hceTtlMs)
                            isNfcActive = true
                            errorMessage = null
                        } catch (e: Exception) {
                            errorMessage = e.message
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    if (isNfcActive) {
                        stringResource(R.string.tapmomo_get_paid_deactivate_button)
                    } else {
                        stringResource(R.string.tapmomo_get_paid_activate_button)
                    }
                )
            }
        }
    }
}

@Composable
private fun ErrorCard(message: String) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            color = MaterialTheme.colorScheme.onErrorContainer
        )
    }
}
