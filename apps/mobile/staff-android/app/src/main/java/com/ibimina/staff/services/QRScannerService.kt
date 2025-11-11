package com.ibimina.staff.services

import android.content.Context
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * QR Scanner Service for member verification and payment processing
 * 
 * Uses Google ML Kit for fast and accurate QR code scanning.
 * Supports:
 * - Member QR codes for verification
 * - Payment QR codes
 * - Group (ikimina) QR codes
 */
@Singleton
class QRScannerService @Inject constructor(
    private val context: Context
) {
    
    private val _scannedCodes = MutableStateFlow<String?>(null)
    val scannedCodes: StateFlow<String?> = _scannedCodes
    
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private val barcodeScanner = BarcodeScanning.getClient()
    
    /**
     * Start camera and QR code scanning
     */
    fun startScanning(
        lifecycleOwner: LifecycleOwner,
        previewView: androidx.camera.view.PreviewView
    ) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            // Preview use case
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
            
            // Image analysis use case
            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        val mediaImage = imageProxy.image
                        if (mediaImage != null) {
                            val image = InputImage.fromMediaImage(
                                mediaImage,
                                imageProxy.imageInfo.rotationDegrees
                            )
                            
                            barcodeScanner.process(image)
                                .addOnSuccessListener { barcodes ->
                                    processBarcodes(barcodes)
                                }
                                .addOnCompleteListener {
                                    imageProxy.close()
                                }
                        } else {
                            imageProxy.close()
                        }
                    }
                }
            
            // Select back camera
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                // Unbind all use cases before rebinding
                cameraProvider.unbindAll()
                
                // Bind use cases to camera
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (e: Exception) {
                // Handle camera binding error
                e.printStackTrace()
            }
            
        }, context.mainExecutor)
    }
    
    private fun processBarcodes(barcodes: List<Barcode>) {
        for (barcode in barcodes) {
            when (barcode.valueType) {
                Barcode.TYPE_TEXT -> {
                    barcode.rawValue?.let { value ->
                        _scannedCodes.value = value
                    }
                }
                Barcode.TYPE_URL -> {
                    barcode.url?.url?.let { url ->
                        _scannedCodes.value = url
                    }
                }
                else -> {
                    barcode.rawValue?.let { value ->
                        _scannedCodes.value = value
                    }
                }
            }
        }
    }
    
    /**
     * Stop scanning and release resources
     */
    fun stopScanning() {
        cameraExecutor.shutdown()
        barcodeScanner.close()
    }
}
