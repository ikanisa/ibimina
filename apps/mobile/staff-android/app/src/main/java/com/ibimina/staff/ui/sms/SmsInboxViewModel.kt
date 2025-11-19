package com.ibimina.staff.ui.sms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ibimina.staff.domain.momo.ObserveMomoTransactionsUseCase
import com.ibimina.staff.domain.momo.SmsInboxUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

@HiltViewModel
class SmsInboxViewModel @Inject constructor(
    observeMomoTransactionsUseCase: ObserveMomoTransactionsUseCase
) : ViewModel() {
    val uiState: StateFlow<SmsInboxUiState> = observeMomoTransactionsUseCase()
        .map { SmsInboxUiState(it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = SmsInboxUiState()
        )
}
