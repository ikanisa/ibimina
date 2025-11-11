package rw.gov.ikanisa.ibimina.client.nfc

import android.os.Bundle
import androidx.test.core.app.ServiceScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PayeeCardServiceTest {

    @After
    fun tearDown() {
        PayeeCardService.clearActivePayload("test cleanup")
    }

    @Test
    fun returnsPayloadWhenArmed() {
        val payload = ActivePayload(
            payloadJson = basePayload().toString(),
            signatureBase64 = "ZmFrZVNpZw==",
            merchantAccount = "12345",
            merchantName = "Cafe Irembo",
            amountMinor = 2500,
            currency = "RWF",
            note = "Macchiato",
            nonce = "abc",
            issuedAtMillis = System.currentTimeMillis(),
            expiresAtMillis = System.currentTimeMillis() + 60_000
        )

        ServiceScenario.launch(PayeeCardService::class.java).use { scenario ->
            scenario.onService { service ->
                PayeeCardService.arm(payload)
                val selectResponse = service.processCommandApdu(PayeeCardService.buildSelectApdu(), Bundle())
                assertArrayEquals(PayeeCardService.STATUS_SUCCESS, selectResponse)

                val response = service.processCommandApdu(PayeeCardService.COMMAND_GET_PAYLOAD, Bundle())
                assertTrue(response!!.size > 2)
                val statusWord = response.takeLast(2).toByteArray()
                assertArrayEquals(PayeeCardService.STATUS_SUCCESS, statusWord)
            }
        }
    }

    @Test
    fun clearsExpiredPayload() {
        val payload = ActivePayload(
            payloadJson = basePayload().toString(),
            signatureBase64 = "ZmFrZVNpZw==",
            merchantAccount = "6789",
            merchantName = "Expired Merchant",
            amountMinor = 100,
            currency = "RWF",
            note = null,
            nonce = "def",
            issuedAtMillis = System.currentTimeMillis() - 120_000,
            expiresAtMillis = System.currentTimeMillis() - 60_000
        )

        ServiceScenario.launch(PayeeCardService::class.java).use { scenario ->
            scenario.onService { service ->
                PayeeCardService.arm(payload)
                val response = service.processCommandApdu(PayeeCardService.COMMAND_GET_PAYLOAD, Bundle())
                assertArrayEquals(PayeeCardService.STATUS_EXPIRED, response)
                assertEquals(null, PayeeCardService.activePayload())
            }
        }
    }

    private fun basePayload(): JSONObject {
        return JSONObject().apply {
            put("ver", 1)
            put("user_id", "user")
            put("device_id", "device")
            put("merchant_account", "12345")
            put("merchant_name", "Cafe Irembo")
            put("amount_minor", 2500)
            put("currency", "RWF")
            put("nonce", "abc")
            put("iat", System.currentTimeMillis() / 1000)
            put("exp", System.currentTimeMillis() / 1000 + 120)
        }
    }
}
