package com.tapmomo.feature.nfc

import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import com.tapmomo.feature.core.TimeUtils
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Host Card Emulation service for payee (merchant) mode
 * Responds to NFC reader with payment payload
 */
class PayeeCardService : HostApduService() {
    
    companion object {
        // AID: F01234567890
        private val SELECT_AID = byteArrayOf(
            0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(),
            0x06.toByte(), 0xF0.toByte(), 0x12.toByte(), 0x34.toByte(),
            0x56.toByte(), 0x78.toByte(), 0x90.toByte(), 0x00.toByte()
        )
        
        // Status words
        private val SW_SUCCESS = byteArrayOf(0x90.toByte(), 0x00.toByte())
        private val SW_FILE_NOT_FOUND = byteArrayOf(0x6A.toByte(), 0x82.toByte())
        private val SW_WRONG_LENGTH = byteArrayOf(0x67.toByte(), 0x00.toByte())
        
        // Payload storage
        private var currentPayload: String? = null
        private var payloadExpiry: Long = 0
        
        /**
         * Set the current payment payload
         */
        fun setPayload(payload: String, ttlMs: Long) {
            currentPayload = payload
            payloadExpiry = System.currentTimeMillis() + ttlMs
        }
        
        /**
         * Clear the current payment payload
         */
        fun clearPayload() {
            currentPayload = null
            payloadExpiry = 0
        }
        
        /**
         * Check if payload is active and not expired
         */
        fun isPayloadActive(): Boolean {
            return currentPayload != null && System.currentTimeMillis() < payloadExpiry
        }
        
        /**
         * Get remaining TTL in milliseconds
         */
        fun getRemainingTtl(): Long {
            if (!isPayloadActive()) return 0
            return (payloadExpiry - System.currentTimeMillis()).coerceAtLeast(0)
        }
    }
    
    override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray {
        if (commandApdu == null) {
            return SW_WRONG_LENGTH
        }
        
        // Check if this is a SELECT AID command
        if (isSelectAidCommand(commandApdu)) {
            // Check if we have an active payload
            if (!isPayloadActive()) {
                return SW_FILE_NOT_FOUND
            }
            
            // Return payload as UTF-8 bytes with success status word
            val payloadBytes = currentPayload!!.toByteArray(Charsets.UTF_8)
            return payloadBytes + SW_SUCCESS
        }
        
        // Unknown command
        return SW_FILE_NOT_FOUND
    }
    
    override fun onDeactivated(reason: Int) {
        // NFC link deactivated
        // Payload remains active until TTL expires or cleared manually
    }
    
    private fun isSelectAidCommand(commandApdu: ByteArray): Boolean {
        if (commandApdu.size < 12) return false
        
        // Check if command matches SELECT AID structure
        return commandApdu[0] == 0x00.toByte() &&
                commandApdu[1] == 0xA4.toByte() &&
                commandApdu[2] == 0x04.toByte() &&
                commandApdu[3] == 0x00.toByte() &&
                commandApdu[4] == 0x06.toByte() &&
                commandApdu[5] == 0xF0.toByte() &&
                commandApdu[6] == 0x12.toByte() &&
                commandApdu[7] == 0x34.toByte() &&
                commandApdu[8] == 0x56.toByte() &&
                commandApdu[9] == 0x78.toByte() &&
                commandApdu[10] == 0x90.toByte()
    }
}
