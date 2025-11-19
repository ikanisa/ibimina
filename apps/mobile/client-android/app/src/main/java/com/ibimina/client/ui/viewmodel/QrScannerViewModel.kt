package com.ibimina.client.ui.viewmodel

import androidx.camera.view.LifecycleCameraController
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.service.QRScannerService
import com.ibimina.client.data.remote.SupabaseService
import com.ibimina.client.data.remote.api.QrAuthApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class QrApprovalStatus { Idle, Submitting, Success, Error }

@HiltViewModel
class QrScannerViewModel @Inject constructor(
    private val qrScannerService: QRScannerService,
    private val supabaseService: SupabaseService,
    private val qrAuthApi: QrAuthApi
) : ViewModel() {

    val scannedCode: StateFlow<String?> = qrScannerService.scannedCode
    private val _approvalStatus = MutableStateFlow(QrApprovalStatus.Idle)
    val approvalStatus: StateFlow<QrApprovalStatus> = _approvalStatus.asStateFlow()
    private val _approvalMessage = MutableStateFlow<String?>(null)
    val approvalMessage: StateFlow<String?> = _approvalMessage.asStateFlow()
    private var lastSubmittedToken: String? = null

    fun createController(): LifecycleCameraController = qrScannerService.createController()

    fun startScanning(controller: LifecycleCameraController, lifecycleOwner: LifecycleOwner) {
        qrScannerService.bindToLifecycle(controller, lifecycleOwner)
    }

    fun stopScanning(controller: LifecycleCameraController) {
        qrScannerService.stopScanning(controller)
    }

    fun handleScannedToken(token: String?) {
        if (token.isNullOrBlank() || token == lastSubmittedToken) return
        lastSubmittedToken = token
        submitApproval(token)
    }

    private fun submitApproval(token: String) {
        viewModelScope.launch {
            _approvalStatus.value = QrApprovalStatus.Submitting
            _approvalMessage.value = "Submitting approval..."
            try {
                val session = supabaseService.currentSessionTokens()
                    ?: throw IllegalStateException("No active Supabase session for QR approval")
                val approved = qrAuthApi.exchangeQrToken(token, session.first, session.second)
                if (approved) {
                    _approvalStatus.value = QrApprovalStatus.Success
                    _approvalMessage.value = "Login approved. You can continue on the web app."
                } else {
                    _approvalStatus.value = QrApprovalStatus.Error
                    _approvalMessage.value = "Approval failed. Please retry."
                }
            } catch (ex: Exception) {
                _approvalStatus.value = QrApprovalStatus.Error
                _approvalMessage.value = ex.message ?: "Unable to submit approval"
            }
        }
    }
}
