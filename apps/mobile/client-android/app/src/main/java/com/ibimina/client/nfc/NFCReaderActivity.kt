package com.ibimina.client.nfc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import com.ibimina.client.ui.theme.IbiminaClientTheme

/**
 * NFCReaderActivity for reading payment information from NFC tags
 * 
 * This activity is launched when the app needs to read NFC payment data.
 * Use cases:
 * - TapMoMo payment verification
 * - Member card scanning
 * - Quick payment lookup
 */
@AndroidEntryPoint
class NFCReaderActivity : ComponentActivity() {
    
    @Inject
    lateinit var nfcManager: NFCManager
    
    private var nfcData by mutableStateOf<String?>(null)
    private var isScanning by mutableStateOf(true)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        nfcManager.initialize(this)
        
        setContent {
            IbiminaClientTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NFCReaderScreen(
                        nfcData = nfcData,
                        isScanning = isScanning,
                        isNfcAvailable = nfcManager.isNfcAvailable(),
                        isNfcEnabled = nfcManager.isNfcEnabled(),
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
        
        if (android.nfc.NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action ||
            android.nfc.NfcAdapter.ACTION_TAG_DISCOVERED == intent.action ||
            android.nfc.NfcAdapter.ACTION_TECH_DISCOVERED == intent.action) {
            
            val data = nfcManager.readNFCTag(intent)
            if (data != null) {
                nfcData = data
                isScanning = false
                
                // Return result to calling activity
                val resultIntent = android.content.Intent().apply {
                    putExtra("nfc_data", data)
                }
                setResult(RESULT_OK, resultIntent)
                
                // Auto-close after a short delay
                window.decorView.postDelayed({
                    finish()
                }, 1500)
            }
        }
    }
}

@Composable
fun NFCReaderScreen(
    nfcData: String?,
    isScanning: Boolean,
    isNfcAvailable: Boolean,
    isNfcEnabled: Boolean,
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
            nfcData != null -> {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = "Success",
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "NFC Tag Read Successfully",
                    style = MaterialTheme.typography.headlineSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = nfcData,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            isScanning -> {
                CircularProgressIndicator(
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Hold your phone near the NFC tag",
                    style = MaterialTheme.typography.headlineSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Keep both devices steady",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Cancel")
        }
    }
}
