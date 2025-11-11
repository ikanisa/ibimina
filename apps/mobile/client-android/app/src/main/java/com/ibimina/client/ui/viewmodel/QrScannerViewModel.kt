package com.ibimina.client.ui.viewmodel

import androidx.camera.view.LifecycleCameraController
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import com.ibimina.client.service.QRScannerService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class QrScannerViewModel @Inject constructor(
    private val qrScannerService: QRScannerService
) : ViewModel() {

    val scannedCode: StateFlow<String?> = qrScannerService.scannedCode

    fun createController(): LifecycleCameraController = qrScannerService.createController()

    fun startScanning(controller: LifecycleCameraController, lifecycleOwner: LifecycleOwner) {
        qrScannerService.bindToLifecycle(controller, lifecycleOwner)
    }

    fun stopScanning(controller: LifecycleCameraController) {
        qrScannerService.stopScanning(controller)
    }
}
