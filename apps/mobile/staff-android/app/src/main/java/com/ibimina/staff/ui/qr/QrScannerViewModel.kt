package com.ibimina.staff.ui.qr

import androidx.camera.view.PreviewView
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import com.ibimina.staff.service.QRScannerService
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow

@HiltViewModel
class QrScannerViewModel @Inject constructor(
    private val qrScannerService: QRScannerService
) : ViewModel() {
    val scannedCodes: StateFlow<String?> = qrScannerService.scannedCodes

    fun startScanner(lifecycleOwner: LifecycleOwner, previewView: PreviewView) {
        qrScannerService.startScanning(lifecycleOwner, previewView)
    }

    fun stopScanner() {
        qrScannerService.stopScanning()
    }

    fun clearResult() {
        qrScannerService.clearLastResult()
    }
}
