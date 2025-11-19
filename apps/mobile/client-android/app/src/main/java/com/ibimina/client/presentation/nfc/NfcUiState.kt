package com.ibimina.client.presentation.nfc

import android.nfc.Tag

data class NfcUiState(
    val isNfcAvailable: Boolean = false,
    val isNfcEnabled: Boolean = false,
    val lastReadPayload: String? = null,
    val lastWrittenPayload: String? = null,
    val pendingTag: Tag? = null,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
    val memberId: String? = null
)
