package com.ibimina.client.service

import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DefaultMomoSmsServiceTest {

    private val service = DefaultMomoSmsService()

    @Test
    fun triageFeedUpdatesWhenMessageArrives() = runTest {
        service.start()

        val sms = SmsMessage(
            sender = "MTN",
            body = "Payment received",
            timestamp = 1234L
        )

        service.ingest(sms)

        val triagedMessages = service.triageFeed.first { it.isNotEmpty() }
        assertThat(triagedMessages).hasSize(1)
        val message = triagedMessages.first()
        assertThat(message.sender).isEqualTo("MTN")
        assertThat(message.status).isEqualTo(SmsStatus.Pending)

        service.markHandled(message.id)

        val handledMessages = service.triageFeed.first { current ->
            current.firstOrNull { it.id == message.id }?.status == SmsStatus.Handled
        }
        assertThat(handledMessages.first().status).isEqualTo(SmsStatus.Handled)
    }
}
