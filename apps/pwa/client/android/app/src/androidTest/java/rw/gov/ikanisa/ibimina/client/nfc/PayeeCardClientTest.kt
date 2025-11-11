package rw.gov.ikanisa.ibimina.client.nfc

import android.nfc.tech.IsoDep
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

@RunWith(AndroidJUnit4::class)
class PayeeCardClientTest {

    @Test
    fun readPayloadRoundTrips() {
        val isoDep = mock(IsoDep::class.java)
        val payloadBytes = "{}".toByteArray()
        whenever(isoDep.transceive(any())).thenReturn(
            PayeeCardService.STATUS_SUCCESS,
            payloadBytes + PayeeCardService.STATUS_SUCCESS
        )

        val client = PayeeCardClient(isoDep)
        val payload = client.readPayload()

        assertArrayEquals(payloadBytes, payload)
        verify(isoDep).connect()
        verify(isoDep).close()
    }

    @Test
    fun throwsWhenSelectFails() {
        val isoDep = mock(IsoDep::class.java)
        whenever(isoDep.transceive(any())).thenReturn(byteArrayOf(0x6A))

        val client = PayeeCardClient(isoDep)
        assertThrows(IllegalStateException::class.java) {
            client.readPayload()
        }
        verify(isoDep).close()
    }
}
