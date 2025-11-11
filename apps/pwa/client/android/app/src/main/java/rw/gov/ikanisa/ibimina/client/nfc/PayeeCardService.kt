package rw.gov.ikanisa.ibimina.client.nfc

import android.nfc.cardemulation.HostApduService
import android.nfc.tech.IsoDep
import android.os.Bundle
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.max

class PayeeCardService : HostApduService() {

    override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray? {
        if (commandApdu == null) {
            return STATUS_UNKNOWN
        }

        if (commandApdu.contentEquals(EXPECTED_SELECT_AID)) {
            val payload = ACTIVE_PAYLOAD.get()
            return if (payload == null) {
                STATUS_NOT_READY
            } else if (payload.isExpired()) {
                clearActivePayload("expired on select")
                STATUS_EXPIRED
            } else {
                STATUS_SELECT_OK
            }
        }

        if (commandApdu.contentEquals(COMMAND_GET_PAYLOAD)) {
            val payload = ACTIVE_PAYLOAD.get()
            if (payload == null) {
                return STATUS_NOT_READY
            }

            return if (payload.isExpired()) {
                clearActivePayload("expired on get")
                STATUS_EXPIRED
            } else {
                payload.toApduResponse(STATUS_SUCCESS)
            }
        }

        Log.w(TAG, "Received unknown APDU: ${commandApdu.joinToString(separator = " ") { String.format("%02X", it) }}")
        return STATUS_UNKNOWN
    }

    override fun onDeactivated(reason: Int) {
        Log.d(TAG, "HCE deactivated: $reason")
        if (reason == DEACTIVATION_DESELECTED || reason == DEACTIVATION_LINK_LOSS) {
            ACTIVE_PAYLOAD.get()?.let {
                if (it.isExpired()) {
                    clearActivePayload("expired on deactivate")
                }
            }
        }
    }

    companion object {
        private const val TAG = "PayeeCardService"
        private val ACTIVE_PAYLOAD = AtomicReference<ActivePayload?>(null)
        private val PAYLOAD_FLOW = MutableStateFlow<ActivePayload?>(null)

        private val AID: ByteArray = byteArrayOf(0xF0.toByte(), 0x01, 0x02, 0x03, 0x04, 0x05, 0x06)
        private val EXPECTED_SELECT_AID: ByteArray = byteArrayOf(
            0x00,
            0xA4.toByte(),
            0x04,
            0x00,
            AID.size.toByte(),
            *AID
        )

        internal val COMMAND_GET_PAYLOAD: ByteArray = byteArrayOf(0x80.toByte(), 0xCA.toByte(), 0x9F.toByte(), 0x7F.toByte(), 0x00)
        internal val STATUS_SUCCESS: ByteArray = byteArrayOf(0x90.toByte(), 0x00)
        private val STATUS_SELECT_OK: ByteArray = STATUS_SUCCESS
        private val STATUS_NOT_READY: ByteArray = byteArrayOf(0x69.toByte(), 0x85.toByte())
        private val STATUS_UNKNOWN: ByteArray = byteArrayOf(0x6D.toByte(), 0x00)
        internal val STATUS_EXPIRED: ByteArray = byteArrayOf(0x69.toByte(), 0x84.toByte())

        fun arm(payload: ActivePayload) {
            ACTIVE_PAYLOAD.set(payload)
            PAYLOAD_FLOW.value = payload
            Log.d(TAG, "Armed payload for merchant=${payload.merchantName} amount=${payload.amountMinor}")
        }

        fun clearActivePayload(reason: String = "manual") {
            val removed = ACTIVE_PAYLOAD.getAndSet(null)
            if (removed != null) {
                Log.d(TAG, "Clearing active payload ($reason)")
                PAYLOAD_FLOW.value = null
            }
        }

        fun activePayload(): ActivePayload? = ACTIVE_PAYLOAD.get()

        fun activePayloadFlow(): StateFlow<ActivePayload?> = PAYLOAD_FLOW.asStateFlow()

        fun buildSelectApdu(aid: ByteArray = AID): ByteArray {
            return byteArrayOf(0x00, 0xA4.toByte(), 0x04, 0x00, aid.size.toByte(), *aid)
        }
    }
}

/**
 * Data class describing an armed HCE payload ready for transmission.
 */
data class ActivePayload(
    val payloadJson: String,
    val signatureBase64: String,
    val merchantAccount: String,
    val merchantName: String,
    val amountMinor: Long,
    val currency: String,
    val note: String?,
    val nonce: String,
    val issuedAtMillis: Long,
    val expiresAtMillis: Long
) {
    fun isExpired(now: Long = System.currentTimeMillis()): Boolean = now >= expiresAtMillis

    fun remainingSeconds(now: Long = System.currentTimeMillis()): Long =
        max(0L, (expiresAtMillis - now + 999) / 1000)

    internal fun toApduResponse(statusWord: ByteArray): ByteArray {
        val envelope = JSONObject().apply {
            put("payload", JSONObject(payloadJson))
            put("signature", signatureBase64)
            put("expires_at", expiresAtMillis)
        }.toString().toByteArray(Charsets.UTF_8)
        return envelope + statusWord
    }

    fun toTransactionEntity(): rw.gov.ikanisa.ibimina.client.data.transactions.TransactionEntity {
        return rw.gov.ikanisa.ibimina.client.data.transactions.TransactionEntity(
            merchantName = merchantName,
            merchantAccount = merchantAccount,
            amountMinor = amountMinor,
            currency = currency,
            note = note ?: "",
            nonce = nonce,
            signedAt = issuedAtMillis,
            signature = signatureBase64,
            payload = payloadJson
        )
    }
}

/**
 * Lightweight IsoDep client helper for instrumentation testing and manual validation.
 */
class PayeeCardClient(private val isoDep: IsoDep) {
    fun readPayload(): ByteArray {
        try {
            isoDep.connect()
            val selectResponse = isoDep.transceive(PayeeCardService.buildSelectApdu())
            if (!selectResponse.contentEquals(PayeeCardService.STATUS_SUCCESS)) {
                throw IllegalStateException("SELECT AID failed: ${selectResponse.joinToString { String.format("%02X", it) }}")
            }

            val payloadResponse = isoDep.transceive(PayeeCardService.COMMAND_GET_PAYLOAD)
            if (payloadResponse.size < 2) {
                throw IllegalStateException("Invalid APDU response length")
            }

            val status = payloadResponse.takeLast(2).toByteArray()
            if (!status.contentEquals(PayeeCardService.STATUS_SUCCESS)) {
                throw IllegalStateException("Unexpected status word: ${status.joinToString { String.format("%02X", it) }}")
            }

            return payloadResponse.copyOfRange(0, payloadResponse.size - 2)
        } finally {
            try {
                isoDep.close()
            } catch (ignored: Exception) {
                Log.w("PayeeCardClient", "Failed to close IsoDep", ignored)
            }
        }
    }
}
