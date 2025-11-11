package com.ibimina.client.ui.viewmodel

import androidx.lifecycle.ViewModel
import com.ibimina.client.service.MomoSmsService
import com.ibimina.client.service.SmsMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class SmsTriageViewModel @Inject constructor(
    private val momoSmsService: MomoSmsService
) : ViewModel() {

    val triageFeed: StateFlow<List<SmsMessage>> = momoSmsService.triageFeed

    init {
        momoSmsService.start()
    }

    fun markHandled(id: String) {
        momoSmsService.markHandled(id)
    }

    override fun onCleared() {
        super.onCleared()
        momoSmsService.stop()
    }
}
