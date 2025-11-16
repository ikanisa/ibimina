package com.ibimina.client

import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import androidx.hilt.navigation.compose.hiltViewModel
import com.ibimina.client.data.auth.AuthState
import com.ibimina.client.presentation.auth.AuthViewModel
import com.ibimina.client.presentation.auth.OnboardingScreen
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
                    IbiminaApp()
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

@Composable
private fun IbiminaApp() {
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.authState.collectAsState()

    when (authState) {
        is AuthState.Authenticated -> IbiminaNavHost()
        AuthState.Loading -> Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
        AuthState.SignedOut -> OnboardingScreen(viewModel = authViewModel)
    }
}
