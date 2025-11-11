package com.ibimina.client.service

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

interface MomoSmsService {
    val triageFeed: StateFlow<List<SmsMessage>>
    fun start()
    fun stop()
    fun ingest(message: SmsMessage)
    fun markHandled(id: String)
}

@Singleton
class DefaultMomoSmsService @Inject constructor() : MomoSmsService {

    private val _triageFeed = MutableStateFlow<List<SmsMessage>>(emptyList())
    override val triageFeed: StateFlow<List<SmsMessage>> = _triageFeed.asStateFlow()

    override fun start() {
        // Placeholder for registering SMS listeners in production builds.
    }

    override fun stop() {
        // Placeholder for unregistering SMS listeners.
    }

    override fun ingest(message: SmsMessage) {
        _triageFeed.update { current ->
            (current + message).sortedByDescending { it.timestamp }
        }
    }

    override fun markHandled(id: String) {
        _triageFeed.update { current ->
            current.map { message ->
                if (message.id == id) message.copy(status = SmsStatus.Handled) else message
            }
        }
    }
}

data class SmsMessage(
    val id: String = UUID.randomUUID().toString(),
    val sender: String,
    val body: String,
    val timestamp: Long,
    val status: SmsStatus = SmsStatus.Pending
)

enum class SmsStatus {
    Pending,
    Handled
}
