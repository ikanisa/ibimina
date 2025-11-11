package com.ibimina.staff.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * MoMo SMS Service for parsing mobile money transaction messages
 * 
 * This service listens for incoming SMS messages from mobile money providers
 * (MTN MoMo, Airtel Money) and extracts transaction details for reconciliation.
 * 
 * Features:
 * - Automatic SMS parsing
 * - Transaction detail extraction (amount, reference, sender)
 * - Support for multiple mobile money providers
 */
@Singleton
class MomoSmsService @Inject constructor() : BroadcastReceiver() {
    
    private val _transactions = MutableStateFlow<List<MomoTransaction>>(emptyList())
    val transactions: StateFlow<List<MomoTransaction>> = _transactions
    
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            messages.forEach { message ->
                parseMomoSms(message)
            }
        }
    }
    
    private fun parseMomoSms(message: SmsMessage) {
        val sender = message.displayOriginatingAddress
        val body = message.displayMessageBody
        
        // Parse MTN MoMo messages
        if (sender.contains("MTN", ignoreCase = true)) {
            parseMtnMomo(body)
        }
        
        // Parse Airtel Money messages
        if (sender.contains("Airtel", ignoreCase = true)) {
            parseAirtelMoney(body)
        }
    }
    
    private fun parseMtnMomo(body: String) {
        // Pattern: "You have received RWF 5,000 from 078XXXXXXX. Ref: XXXXXXXXX"
        val amountRegex = Regex("RWF\\s+([0-9,]+)")
        val refRegex = Regex("Ref:\\s+([A-Z0-9]+)")
        val phoneRegex = Regex("from\\s+(\\d+)")
        
        val amount = amountRegex.find(body)?.groupValues?.get(1)?.replace(",", "")
        val reference = refRegex.find(body)?.groupValues?.get(1)
        val phone = phoneRegex.find(body)?.groupValues?.get(1)
        
        if (amount != null && reference != null) {
            val transaction = MomoTransaction(
                provider = "MTN",
                amount = amount.toDoubleOrNull() ?: 0.0,
                reference = reference,
                senderPhone = phone,
                timestamp = System.currentTimeMillis()
            )
            addTransaction(transaction)
        }
    }
    
    private fun parseAirtelMoney(body: String) {
        // Pattern: "You have received RWF 5,000 from 073XXXXXXX. Transaction ID: XXXXXXXXX"
        val amountRegex = Regex("RWF\\s+([0-9,]+)")
        val refRegex = Regex("Transaction ID:\\s+([A-Z0-9]+)")
        val phoneRegex = Regex("from\\s+(\\d+)")
        
        val amount = amountRegex.find(body)?.groupValues?.get(1)?.replace(",", "")
        val reference = refRegex.find(body)?.groupValues?.get(1)
        val phone = phoneRegex.find(body)?.groupValues?.get(1)
        
        if (amount != null && reference != null) {
            val transaction = MomoTransaction(
                provider = "Airtel",
                amount = amount.toDoubleOrNull() ?: 0.0,
                reference = reference,
                senderPhone = phone,
                timestamp = System.currentTimeMillis()
            )
            addTransaction(transaction)
        }
    }
    
    private fun addTransaction(transaction: MomoTransaction) {
        _transactions.value = _transactions.value + transaction
    }
}

/**
 * Data class representing a mobile money transaction
 */
data class MomoTransaction(
    val provider: String,
    val amount: Double,
    val reference: String,
    val senderPhone: String?,
    val timestamp: Long
)
