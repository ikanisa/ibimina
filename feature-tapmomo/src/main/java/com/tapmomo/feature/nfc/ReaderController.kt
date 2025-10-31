package com.tapmomo.feature.nfc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import com.tapmomo.feature.data.models.PaymentPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.IOException

/**
 * NFC Reader mode controller for payer mode
 * Reads payment payload from merchant's phone
 */
class ReaderController(private val activity: Activity) {
    
    private val nfcAdapter: NfcAdapter? = NfcAdapter.getDefaultAdapter(activity)
    private var readerCallback: NfcAdapter.ReaderCallback? = null
    
    companion object {
        // SELECT AID command for TapMoMo
        private val SELECT_AID_COMMAND = byteArrayOf(
            0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(),
            0x06.toByte(), 0xF0.toByte(), 0x12.toByte(), 0x34.toByte(),
            0x56.toByte(), 0x78.toByte(), 0x90.toByte(), 0x00.toByte()
        )
        
        // NFC reader flags
        private const val READER_FLAGS = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
    }
    
    /**
     * Enable NFC reader mode
     */
    fun enableReaderMode(onTagDiscovered: (PaymentPayload?) -> Unit) {
        if (nfcAdapter == null) {
            onTagDiscovered(null)
            return
        }
        
        readerCallback = NfcAdapter.ReaderCallback { tag ->
            val payload = readPayloadFromTag(tag)
            onTagDiscovered(payload)
        }
        
        nfcAdapter.enableReaderMode(
            activity,
            readerCallback,
            READER_FLAGS,
            null
        )
    }
    
    /**
     * Disable NFC reader mode
     */
    fun disableReaderMode() {
        nfcAdapter?.disableReaderMode(activity)
        readerCallback = null
    }
    
    /**
     * Read payment payload from NFC tag
     */
    private fun readPayloadFromTag(tag: Tag): PaymentPayload? {
        val isoDep = IsoDep.get(tag) ?: return null
        
        try {
            isoDep.connect()
            
            // Send SELECT AID command
            val response = isoDep.transceive(SELECT_AID_COMMAND)
            
            // Check response
            if (response == null || response.size < 2) {
                return null
            }
            
            // Check status word (last 2 bytes should be 0x9000)
            val statusWord = response.sliceArray(response.size - 2 until response.size)
            if (statusWord[0] != 0x90.toByte() || statusWord[1] != 0x00.toByte()) {
                return null
            }
            
            // Extract payload (everything except status word)
            val payloadBytes = response.sliceArray(0 until response.size - 2)
            val payloadJson = String(payloadBytes, Charsets.UTF_8)
            
            // Parse JSON payload
            return try {
                Json.decodeFromString<PaymentPayload>(payloadJson)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
            
        } catch (e: IOException) {
            e.printStackTrace()
            return null
        } finally {
            try {
                isoDep.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Check if NFC is available
     */
    fun isNfcAvailable(): Boolean {
        return nfcAdapter != null
    }
    
    /**
     * Check if NFC is enabled
     */
    fun isNfcEnabled(): Boolean {
        return nfcAdapter?.isEnabled == true
    }
}

/**
 * Suspend wrapper for reading payment payload
 */
suspend fun ReaderController.readPayloadAsync(tag: Tag): PaymentPayload? = withContext(Dispatchers.IO) {
    // The readPayloadFromTag is already synchronous, but we can wrap it for coroutine context
    val isoDep = IsoDep.get(tag) ?: return@withContext null
    
    try {
        isoDep.connect()
        
        val response = isoDep.transceive(
            byteArrayOf(
                0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(),
                0x06.toByte(), 0xF0.toByte(), 0x12.toByte(), 0x34.toByte(),
                0x56.toByte(), 0x78.toByte(), 0x90.toByte(), 0x00.toByte()
            )
        )
        
        if (response == null || response.size < 2) {
            return@withContext null
        }
        
        val statusWord = response.sliceArray(response.size - 2 until response.size)
        if (statusWord[0] != 0x90.toByte() || statusWord[1] != 0x00.toByte()) {
            return@withContext null
        }
        
        val payloadBytes = response.sliceArray(0 until response.size - 2)
        val payloadJson = String(payloadBytes, Charsets.UTF_8)
        
        Json.decodeFromString<PaymentPayload>(payloadJson)
    } catch (e: Exception) {
        e.printStackTrace()
        null
    } finally {
        try {
            isoDep.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
