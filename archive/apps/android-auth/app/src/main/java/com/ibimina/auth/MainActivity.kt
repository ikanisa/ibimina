package com.ibimina.auth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ibimina.auth.data.AuthRepository
import com.ibimina.auth.data.AuthScreen
import com.ibimina.auth.ui.AuthViewModel
import com.ibimina.auth.ui.AuthViewModel.Factory
import com.ibimina.auth.ui.screens.StartScreen
import com.ibimina.auth.ui.screens.VerifyScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repository = (application as AuthApplication).repository
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AuthApp(repository)
                }
            }
        }
    }
}

@Composable
fun AuthApp(repository: AuthRepository) {
    val viewModel: AuthViewModel = viewModel(factory = Factory(repository))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    when (state.currentScreen) {
        AuthScreen.Start -> StartScreen(
            isLoading = state.isLoading,
            errorMessage = state.errorMessage,
            onSubmit = viewModel::startAuth
        )

        AuthScreen.Verify -> VerifyScreen(
            whatsappNumber = state.whatsappNumber,
            countdownSeconds = state.countdownSeconds,
            isLoading = state.isLoading,
            isResending = state.isResending,
            errorMessage = state.errorMessage,
            onVerify = viewModel::verifyCode,
            onResend = viewModel::resendCode
        )

        AuthScreen.Complete -> CompleteScreen()
    }
}

@Composable
fun CompleteScreen() {
    var acknowledged by remember { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "You're signed in",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )
        Text(
            text = "We’ll keep you authenticated for future API calls.",
            modifier = Modifier.padding(top = 16.dp),
            textAlign = TextAlign.Center
        )
        Button(onClick = { acknowledged = true }, modifier = Modifier.padding(top = 32.dp)) {
            Text("Continue")
        }
        if (!acknowledged) {
            CircularProgressIndicator(modifier = Modifier.padding(top = 24.dp))
        }
    }
}
