package com.ibimina.client.presentation.nfc

import android.app.Activity
import android.content.Intent
import android.nfc.Tag
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.client.data.auth.AuthRepository
import com.ibimina.client.data.nfc.NFCManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class NfcViewModel @Inject constructor(
    private val nfcManager: NFCManager,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NfcUiState())
    val uiState: StateFlow<NfcUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.memberIdFlow.collect { memberId ->
                _uiState.value = _uiState.value.copy(memberId = memberId)
            }
        }
    }

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
            _uiState.value = if (payload != null) {
                _uiState.value.copy(
                    lastReadPayload = payload,
                    infoMessage = "Successfully read tag",
                    errorMessage = null
                )
            } else {
                _uiState.value.copy(
                    errorMessage = "Unable to read NFC tag",
                    infoMessage = null
                )
            }
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
        viewModelScope.launch {
            val success = nfcManager.writeNFCTag(tag, data)
            _uiState.value = if (success) {
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
}
