package com.ibimina.client.service

import android.content.Context
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageProxy
import androidx.camera.view.CameraController
import androidx.camera.view.LifecycleCameraController
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

interface QRScannerService {
    val scannedCode: StateFlow<String?>
    fun createController(): LifecycleCameraController
    fun bindToLifecycle(controller: LifecycleCameraController, lifecycleOwner: LifecycleOwner)
    fun stopScanning(controller: LifecycleCameraController)
}

@Singleton
class CameraQrScannerService @Inject constructor(
    private val context: Context
) : QRScannerService {

    private val scanner: BarcodeScanner = BarcodeScanning.getClient()
    private val _scannedCode = MutableStateFlow<String?>(null)
    override val scannedCode: StateFlow<String?> = _scannedCode.asStateFlow()

    override fun createController(): LifecycleCameraController {
        return LifecycleCameraController(context).apply {
            cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            setEnabledUseCases(CameraController.IMAGE_ANALYSIS or CameraController.PREVIEW)
            setImageAnalysisAnalyzer(
                ContextCompat.getMainExecutor(context)
            ) { imageProxy ->
                processImage(imageProxy)
            }
        }
    }

    override fun bindToLifecycle(controller: LifecycleCameraController, lifecycleOwner: LifecycleOwner) {
        controller.bindToLifecycle(lifecycleOwner)
    }

    override fun stopScanning(controller: LifecycleCameraController) {
        controller.clearImageAnalysisAnalyzer()
    }

    private fun processImage(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                val result = barcodes.firstOrNull()?.rawValue
                if (!result.isNullOrBlank()) {
                    _scannedCode.value = result
                }
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
            .addOnFailureListener {
                imageProxy.close()
            }
    }
}
