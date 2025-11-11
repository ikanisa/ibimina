package com.ibimina.client

import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import com.ibimina.client.presentation.nfc.NfcViewModel
import com.ibimina.client.presentation.navigation.IbiminaNavHost
import com.ibimina.client.ui.theme.IbiminaClientTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val nfcSharedViewModel: NfcViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IbiminaClientTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    IbiminaNavHost()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        nfcSharedViewModel.initialize(this)
        nfcSharedViewModel.enableForegroundDispatch(this)
        intent?.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)?.let(nfcSharedViewModel::onNewTag)
    }

    override fun onPause() {
        nfcSharedViewModel.disableForegroundDispatch(this)
        super.onPause()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        nfcSharedViewModel.readFromIntent(intent)
        intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)?.let(nfcSharedViewModel::onNewTag)
    }
}
