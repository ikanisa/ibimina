package com.ibimina.client

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.ibimina.client.domain.model.NFCPayload
import com.ibimina.client.security.PayloadSigner
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NFCFlowInstrumentedTest {

    @Test
    fun signedPayload_survives_json_roundtrip() {
        val payload = PayloadSigner.createSignedPayload(
            merchantId = "merchant-1",
            network = "MTN",
            amount = 1500.0,
            reference = "INV-123",
            ttlSeconds = 120
        )
        val decoded = NFCPayload.fromJson(payload.toJson())
        requireNotNull(decoded)
        val validation = PayloadSigner.validateSignedPayload(decoded)
        assertTrue(validation.message, validation.valid)
    }

    @Test
    fun expiredPayload_isRejected() {
        val payload = PayloadSigner.createSignedPayload(
            merchantId = "merchant-1",
            network = "Airtel",
            amount = 100.0,
            reference = "INV-999",
            ttlSeconds = 1
        )
        val expired = payload.copy(timestamp = payload.timestamp - 120)
        val validation = PayloadSigner.validateSignedPayload(expired)
        assertFalse(validation.valid)
    }

    @Test
    fun tamperedPayload_signatureFailsValidation() {
        val payload = PayloadSigner.createSignedPayload(
            merchantId = "merchant-1",
            network = "MTN",
            amount = 300.0,
            reference = "INV-42",
            ttlSeconds = 60
        )
        val tampered = payload.copy(amount = payload.amount + 10)
        val validation = PayloadSigner.validateSignedPayload(tampered)
        assertFalse(validation.valid)
    }
}
