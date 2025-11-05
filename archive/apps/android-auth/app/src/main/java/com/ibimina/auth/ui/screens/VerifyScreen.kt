package com.ibimina.auth.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun VerifyScreen(
    whatsappNumber: String,
    countdownSeconds: Int,
    isLoading: Boolean,
    isResending: Boolean,
    errorMessage: String?,
    onVerify: (String) -> Unit,
    onResend: () -> Unit
) {
    var code by remember { mutableStateOf("") }
    val minutes = countdownSeconds / 60
    val seconds = countdownSeconds % 60

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Enter the code sent to $whatsappNumber",
            style = MaterialTheme.typography.titleMedium
        )

        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text("One-time code") },
            keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp)
        )

        if (!errorMessage.isNullOrEmpty()) {
            Text(
                text = errorMessage,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        Button(
            enabled = code.length >= 4 && !isLoading,
            onClick = { onVerify(code) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.padding(4.dp))
            } else {
                Text("Verify")
            }
        }

        Row(
            modifier = Modifier.padding(top = 16.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = if (countdownSeconds > 0) {
                "Resend available in ${minutes}:${seconds.toString().padStart(2, '0')}"
            } else {
                "Didn't get it?"
            })
        }

        Button(
            enabled = countdownSeconds == 0 && !isResending,
            onClick = onResend,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp)
        ) {
            if (isResending) {
                CircularProgressIndicator(modifier = Modifier.padding(4.dp))
            } else {
                Text("Resend code")
            }
        }
    }
}
