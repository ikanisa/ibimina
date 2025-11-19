package com.ibimina.client.ui.screens

import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ibimina.client.ui.viewmodel.QrScannerViewModel
import com.ibimina.client.ui.viewmodel.QrApprovalStatus

@Composable
fun QrScannerRoute(
    viewModel: QrScannerViewModel,
    modifier: Modifier = Modifier
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val controller = remember { viewModel.createController() }
    val scannedCode by viewModel.scannedCode.collectAsStateWithLifecycle()
    val approvalStatus by viewModel.approvalStatus.collectAsStateWithLifecycle()
    val approvalMessage by viewModel.approvalMessage.collectAsStateWithLifecycle()

    DisposableEffect(lifecycleOwner) {
        viewModel.startScanning(controller, lifecycleOwner)
        onDispose { viewModel.stopScanning(controller) }
    }

    LaunchedEffect(scannedCode) {
        viewModel.handleScannedToken(scannedCode)
    }

    QrScannerScreen(
        controller = controller,
        scannedCode = scannedCode,
        approvalStatus = approvalStatus,
        approvalMessage = approvalMessage,
        modifier = modifier
    )
}

@Composable
fun QrScannerScreen(
    controller: LifecycleCameraController,
    scannedCode: String?,
    approvalStatus: QrApprovalStatus,
    approvalMessage: String?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(text = "Scan QR Codes", style = MaterialTheme.typography.headlineSmall)
        Surface(
            tonalElevation = 4.dp,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.6f)
        ) {
            AndroidView(
                factory = {
                    PreviewView(context).apply {
                        this.controller = controller
                        this.scaleType = PreviewView.ScaleType.FILL_CENTER
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = scannedCode?.let { "Latest code: $it" } ?: "No QR code detected yet",
            style = MaterialTheme.typography.bodyLarge
        )
        approvalMessage?.let {
            Text(
                text = it,
                style = MaterialTheme.typography.bodyMedium,
                color = when (approvalStatus) {
                    QrApprovalStatus.Success -> MaterialTheme.colorScheme.primary
                    QrApprovalStatus.Error -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.onSurface
                }
            )
        }
    }
}
