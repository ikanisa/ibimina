package com.ibimina.client.nfc

import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import com.ibimina.client.ui.theme.IbiminaClientTheme

/**
 * NFCWriterActivity for writing payment information to NFC tags
 * 
 * This activity is launched when the app needs to write payment data to NFC tags.
 * Use cases:
 * - TapMoMo payment handoff (merchant side)
 * - Creating payment shortcuts
 * - Member card programming
 */
@AndroidEntryPoint
class NFCWriterActivity : ComponentActivity() {
    
    @Inject
    lateinit var nfcManager: NFCManager
    
    private var paymentData: String? = null
    private var writeStatus by mutableStateOf<WriteStatus>(WriteStatus.Waiting)
    private var countdown by mutableStateOf(60)
    
    sealed class WriteStatus {
        object Waiting : WriteStatus()
        object Success : WriteStatus()
        data class Error(val message: String) : WriteStatus()
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get payment data from intent
        paymentData = intent.getStringExtra("payment_data")
        
        if (paymentData == null) {
            finish()
            return
        }
        
        nfcManager.initialize(this)
        
        // Start countdown timer
        startCountdown()
        
        setContent {
            IbiminaClientTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NFCWriterScreen(
                        writeStatus = writeStatus,
                        countdown = countdown,
                        isNfcAvailable = nfcManager.isNfcAvailable(),
                        isNfcEnabled = nfcManager.isNfcEnabled(),
                        onReactivate = { reactivateWriter() },
                        onCancel = { finish() }
                    )
                }
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        if (nfcManager.isNfcEnabled()) {
            nfcManager.enableForegroundDispatch(this)
        }
    }
    
    override fun onPause() {
        super.onPause()
        if (nfcManager.isNfcEnabled()) {
            nfcManager.disableForegroundDispatch(this)
        }
    }
    
    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        
        if (android.nfc.NfcAdapter.ACTION_TAG_DISCOVERED == intent.action ||
            android.nfc.NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action ||
            android.nfc.NfcAdapter.ACTION_TECH_DISCOVERED == intent.action) {
            
            val tag = intent.getParcelableExtra<Tag>(android.nfc.NfcAdapter.EXTRA_TAG)
            if (tag != null && paymentData != null) {
                val success = nfcManager.writeNFCTag(tag, paymentData!!)
                
                if (success) {
                    writeStatus = WriteStatus.Success
                    // Return success result
                    setResult(RESULT_OK)
                    
                    // Auto-close after showing success
                    window.decorView.postDelayed({
                        finish()
                    }, 1500)
                } else {
                    writeStatus = WriteStatus.Error("Failed to write to NFC tag. Tag may be read-only or incompatible.")
                }
            }
        }
    }
    
    private fun startCountdown() {
        val handler = android.os.Handler(mainLooper)
        val runnable = object : Runnable {
            override fun run() {
                if (countdown > 0 && writeStatus is WriteStatus.Waiting) {
                    countdown--
                    handler.postDelayed(this, 1000)
                } else if (countdown == 0) {
                    writeStatus = WriteStatus.Error("Timeout - Please try again")
                }
            }
        }
        handler.post(runnable)
    }
    
    private fun reactivateWriter() {
        writeStatus = WriteStatus.Waiting
        countdown = 60
        startCountdown()
    }
}

@Composable
fun NFCWriterScreen(
    writeStatus: NFCWriterActivity.WriteStatus,
    countdown: Int,
    isNfcAvailable: Boolean,
    isNfcEnabled: Boolean,
    onReactivate: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        when {
            !isNfcAvailable -> {
                Text(
                    text = "NFC is not available on this device",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
            !isNfcEnabled -> {
                Text(
                    text = "Please enable NFC in your device settings",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
            writeStatus is NFCWriterActivity.WriteStatus.Success -> {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = "Success",
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Payment data written successfully",
                    style = MaterialTheme.typography.headlineSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = "One-time payload sent",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            writeStatus is NFCWriterActivity.WriteStatus.Error -> {
                Icon(
                    imageVector = Icons.Filled.Error,
                    contentDescription = "Error",
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = writeStatus.message,
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onReactivate,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Try Again")
                }
            }
            else -> {
                CircularProgressIndicator(
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Ready to write",
                    style = MaterialTheme.typography.headlineSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = "Ready to scan · ${countdown}s",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Hold your phone near the reader's device",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Keep screen on and unlocked",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        OutlinedButton(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Cancel")
        }
    }
}
