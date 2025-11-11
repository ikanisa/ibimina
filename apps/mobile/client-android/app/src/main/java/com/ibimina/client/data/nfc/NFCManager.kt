package com.ibimina.client.data.nfc

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import java.nio.charset.Charset
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
open class NFCManager @Inject constructor() {

    private var nfcAdapter: NfcAdapter? = null

    fun initialize(activity: Activity) {
        nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
    }

    fun isNfcAvailable(): Boolean = nfcAdapter != null

    fun isNfcEnabled(): Boolean = nfcAdapter?.isEnabled == true

    fun enableForegroundDispatch(activity: Activity) {
        val intent = Intent(activity, activity.javaClass).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pendingIntent = PendingIntent.getActivity(
            activity,
            0,
            intent,
            PendingIntent.FLAG_MUTABLE
        )

        val filters = arrayOf(
            IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED).apply {
                try {
                    addDataType("text/plain")
                } catch (e: IntentFilter.MalformedMimeTypeException) {
                    throw RuntimeException("Failed to add MIME type.", e)
                }
            }
        )

        val techLists = arrayOf(
            arrayOf(Ndef::class.java.name),
            arrayOf(NdefFormatable::class.java.name)
        )

        nfcAdapter?.enableForegroundDispatch(activity, pendingIntent, filters, techLists)
    }

    fun disableForegroundDispatch(activity: Activity) {
        nfcAdapter?.disableForegroundDispatch(activity)
    }

    open fun writeNFCTag(tag: Tag, data: String): Boolean {
        return try {
            val ndefMessage = createNdefMessage(data)
            val ndef = Ndef.get(tag)
            if (ndef != null) {
                ndef.connect()

                if (!ndef.isWritable) {
                    ndef.close()
                    return false
                }

                if (ndef.maxSize < ndefMessage.toByteArray().size) {
                    ndef.close()
                    return false
                }

                ndef.writeNdefMessage(ndefMessage)
                ndef.close()
                true
            } else {
                val ndefFormatable = NdefFormatable.get(tag)
                if (ndefFormatable != null) {
                    ndefFormatable.connect()
                    ndefFormatable.format(ndefMessage)
                    ndefFormatable.close()
                    true
                } else {
                    false
                }
            }
        } catch (e: Exception) {
            false
        }
    }

    open fun readNFCTag(intent: Intent): String? {
        val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG) ?: return null
        val ndef = Ndef.get(tag) ?: return null
        return try {
            ndef.connect()
            val ndefMessage = ndef.ndefMessage
            val records = ndefMessage.records
            val text = records.firstOrNull { it.tnf == NdefRecord.TNF_WELL_KNOWN }?.let { record ->
                val payload = record.payload
                if (payload.size > 3) {
                    String(payload, 3, payload.size - 3, Charset.forName("UTF-8"))
                } else {
                    null
                }
            }
            ndef.close()
            text
        } catch (e: Exception) {
            null
        }
    }

    private fun createNdefMessage(data: String): NdefMessage {
        val languageCode = "en"
        val languageCodeBytes = languageCode.toByteArray(Charset.forName("US-ASCII"))
        val textBytes = data.toByteArray(Charset.forName("UTF-8"))
        val payloadSize = 1 + languageCodeBytes.size + textBytes.size
        val payload = ByteArray(payloadSize)
        payload[0] = languageCodeBytes.size.toByte()
        System.arraycopy(languageCodeBytes, 0, payload, 1, languageCodeBytes.size)
        System.arraycopy(textBytes, 0, payload, 1 + languageCodeBytes.size, textBytes.size)
        val record = NdefRecord(
            NdefRecord.TNF_WELL_KNOWN,
            NdefRecord.RTD_TEXT,
            ByteArray(0),
            payload
        )
        return NdefMessage(arrayOf(record))
    }
}
