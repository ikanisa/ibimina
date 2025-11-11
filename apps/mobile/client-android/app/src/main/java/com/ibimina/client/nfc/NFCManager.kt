package com.ibimina.client.nfc

import android.app.Activity
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NfcAdapter.ReaderCallback
import android.os.Bundle
import java.nio.charset.Charset
import javax.inject.Inject
import javax.inject.Singleton

/**
 * NFCManager handles all NFC read and write operations for the Ibimina Client app
 * 
 * Features:
 * - Read NFC tags for payment information
 * - Write payment data to NFC tags
 * - Support for NDEF formatted tags
 * - Automatic tag formatting if needed
 * 
 * Use cases:
 * - TapMoMo NFC payment handoff
 * - Member card scanning
 * - Payment verification
 */
@Singleton
class NFCManager @Inject constructor() {
    
    private var nfcAdapter: NfcAdapter? = null
    
    /**
     * Initialize NFC adapter
     */
    fun initialize(activity: Activity) {
        nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
    }
    
    /**
     * Check if NFC is available on the device
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
    
    /**
     * Enable foreground dispatch to handle NFC tags when app is in foreground
     */
    fun enableForegroundDispatch(activity: Activity) {
        val intent = Intent(activity, activity.javaClass).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            activity, 0, intent,
            android.app.PendingIntent.FLAG_MUTABLE
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
    
    /**
     * Disable foreground dispatch when app goes to background
     */
    fun disableForegroundDispatch(activity: Activity) {
        nfcAdapter?.disableForegroundDispatch(activity)
    }
    
    /**
     * Write data to an NFC tag
     * 
     * @param tag The NFC tag to write to
     * @param data The payment data to write (JSON format)
     * @return true if write was successful, false otherwise
     */
    fun writeNFCTag(tag: Tag, data: String): Boolean {
        try {
            val ndefMessage = createNdefMessage(data)
            
            // Try to get Ndef tech
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
                return true
            } else {
                // Try to format the tag if not already formatted
                val ndefFormatable = NdefFormatable.get(tag)
                if (ndefFormatable != null) {
                    ndefFormatable.connect()
                    ndefFormatable.format(ndefMessage)
                    ndefFormatable.close()
                    return true
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return false
    }
    
    /**
     * Read data from an NFC tag
     * 
     * @param intent Intent containing the NFC tag data
     * @return The payment data as a string, or null if read failed
     */
    fun readNFCTag(intent: Intent): String? {
        val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
        
        if (tag != null) {
            val ndef = Ndef.get(tag)
            if (ndef != null) {
                try {
                    ndef.connect()
                    val ndefMessage = ndef.ndefMessage
                    val records = ndefMessage.records
                    
                    for (record in records) {
                        if (record.tnf == NdefRecord.TNF_WELL_KNOWN) {
                            val payload = record.payload
                            
                            // Skip the language code bytes (first 3 bytes)
                            if (payload.size > 3) {
                                val text = String(payload, 3, payload.size - 3, Charset.forName("UTF-8"))
                                ndef.close()
                                return text
                            }
                        }
                    }
                    ndef.close()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        return null
    }
    
    /**
     * Create an NDEF message from payment data
     */
    private fun createNdefMessage(data: String): NdefMessage {
        val languageCode = "en"
        val languageCodeBytes = languageCode.toByteArray(Charset.forName("US-ASCII"))
        val textBytes = data.toByteArray(Charset.forName("UTF-8"))
        
        val payloadSize = 1 + languageCodeBytes.size + textBytes.size
        val payload = ByteArray(payloadSize)
        
        // Status byte: UTF-8 encoding, language code length
        payload[0] = languageCodeBytes.size.toByte()
        
        // Language code
        System.arraycopy(languageCodeBytes, 0, payload, 1, languageCodeBytes.size)
        
        // Text
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
