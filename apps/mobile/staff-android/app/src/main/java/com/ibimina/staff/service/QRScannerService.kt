package com.ibimina.staff.service

import android.content.Context
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.Barcode
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

@Singleton
class QRScannerService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val _scannedCodes = MutableStateFlow<String?>(null)
    val scannedCodes: StateFlow<String?> = _scannedCodes.asStateFlow()

    private val barcodeScanner = BarcodeScanning.getClient()
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    private var cameraProvider: ProcessCameraProvider? = null
    private var imageAnalysis: ImageAnalysis? = null
    private var preview: Preview? = null

    fun startScanning(lifecycleOwner: LifecycleOwner, previewView: PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analysis ->
                        analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                            val mediaImage = imageProxy.image
                            if (mediaImage != null) {
                                val image = InputImage.fromMediaImage(
                                    mediaImage,
                                    imageProxy.imageInfo.rotationDegrees
                                )
                                barcodeScanner.process(image)
                                    .addOnSuccessListener { barcodes ->
                                        handleBarcodes(barcodes)
                                    }
                                    .addOnFailureListener { error ->
                                        _scannedCodes.value = "Error: ${error.message}"
                                    }
                                    .addOnCompleteListener {
                                        imageProxy.close()
                                    }
                            } else {
                                imageProxy.close()
                            }
                        }
                    }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (error: Exception) {
                _scannedCodes.value = "Camera error: ${error.message}"
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun stopScanning() {
        imageAnalysis?.clearAnalyzer()
        cameraProvider?.unbindAll()
    }

    fun clearLastResult() {
        _scannedCodes.value = null
    }

    private fun handleBarcodes(barcodes: List<Barcode>) {
        val firstValue = barcodes.firstOrNull()?.rawValue
        if (!firstValue.isNullOrBlank()) {
            _scannedCodes.value = firstValue
        }
    }
}
