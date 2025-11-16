package com.ibimina.client.presentation.nfc

import android.app.Activity
import android.content.Intent
import android.nfc.Tag
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.nfc.NFCManager
import com.ibimina.client.data.repository.NfcPayloadRepository
import com.ibimina.client.domain.model.NFCPayload
import com.ibimina.client.security.PayloadSigner
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class NfcViewModel @Inject constructor(
    private val nfcManager: NFCManager,
    private val payloadRepository: NfcPayloadRepository?
) : ViewModel() {

    private val _uiState = MutableStateFlow(NfcUiState())
    val uiState: StateFlow<NfcUiState> = _uiState.asStateFlow()

    fun initialize(activity: Activity) {
        nfcManager.initialize(activity)
        _uiState.value = _uiState.value.copy(
            isNfcAvailable = nfcManager.isNfcAvailable(),
            isNfcEnabled = nfcManager.isNfcEnabled(),
            infoMessage = if (!nfcManager.isNfcEnabled()) "Enable NFC to proceed" else null
        )
    }

    fun enableForegroundDispatch(activity: Activity) {
        nfcManager.enableForegroundDispatch(activity)
    }

    fun disableForegroundDispatch(activity: Activity) {
        nfcManager.disableForegroundDispatch(activity)
    }

    fun onNewTag(tag: Tag) {
        _uiState.value = _uiState.value.copy(
            pendingTag = tag,
            infoMessage = "Ready to write to tag",
            errorMessage = null
        )
    }

    fun readFromIntent(intent: Intent) {
        viewModelScope.launch {
            val payload = nfcManager.readNFCTag(intent)
            if (payload == null) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Unable to read NFC tag",
                    infoMessage = null
                )
                return@launch
            }
            handleReadPayload(payload)
        }
    }

    fun writeToTag(data: String) {
        val tag = _uiState.value.pendingTag
        if (tag == null) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Tap a tag before writing",
                infoMessage = null
            )
            return
        }
        val parsedPayload = NFCPayload.fromJson(data)
        if (parsedPayload == null) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Payload must be signed NFCPayload JSON",
                infoMessage = null
            )
            return
        }
        val validation = PayloadSigner.validateSignedPayload(parsedPayload)
        if (!validation.valid) {
            _uiState.value = _uiState.value.copy(
                errorMessage = validation.message,
                infoMessage = null
            )
            return
        }
        viewModelScope.launch {
            val success = nfcManager.writeNFCTag(tag, data)
            _uiState.value = if (success) {
                runCatching { payloadRepository?.persist(parsedPayload) }
                _uiState.value.copy(
                    lastWrittenPayload = data,
                    infoMessage = "Successfully wrote to tag",
                    errorMessage = null
                )
            } else {
                _uiState.value.copy(
                    errorMessage = "Unable to write to NFC tag",
                    infoMessage = null
                )
            }
        }
    }

    private suspend fun handleReadPayload(rawPayload: String) {
        val parsed = NFCPayload.fromJson(rawPayload)
        if (parsed == null) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Invalid payload format",
                infoMessage = null
            )
            return
        }
        val validation = PayloadSigner.validateSignedPayload(parsed)
        if (!validation.valid) {
            _uiState.value = _uiState.value.copy(
                errorMessage = validation.message,
                infoMessage = null,
                signatureVerified = false,
                verifiedPayload = null
            )
            return
        }
        _uiState.value = _uiState.value.copy(
            lastReadPayload = rawPayload,
            infoMessage = "Signature verified",
            errorMessage = null,
            signatureVerified = true,
            verifiedPayload = parsed
        )
        runCatching { payloadRepository?.markExhausted(parsed) }
    }
}
