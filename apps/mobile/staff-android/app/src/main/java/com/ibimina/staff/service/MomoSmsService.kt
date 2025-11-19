package com.ibimina.staff.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import com.ibimina.staff.data.momo.MomoTransactionRepository
import com.ibimina.staff.domain.momo.MomoTransaction
import dagger.hilt.android.AndroidEntryPoint
import java.util.Locale
import javax.inject.Inject

@AndroidEntryPoint
class MomoSmsService : BroadcastReceiver() {

    @Inject
    lateinit var repository: MomoTransactionRepository

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        messages?.forEach { message ->
            parseAndStore(message)
        }
    }

    private fun parseAndStore(message: SmsMessage) {
        val sender = message.displayOriginatingAddress ?: ""
        val body = message.displayMessageBody ?: return
        val normalizedSender = sender.lowercase(Locale.getDefault())
        when {
            normalizedSender.contains("mtn") -> parseMtnMessage(body, sender)
            normalizedSender.contains("airtel") -> parseAirtelMessage(body, sender)
            else -> repository.addTransaction(
                MomoTransaction(
                    provider = sender.ifBlank { "Unknown" },
                    amount = 0.0,
                    reference = System.currentTimeMillis().toString(),
                    senderPhone = sender,
                    timestamp = System.currentTimeMillis(),
                    messageBody = body
                )
            )
        }
    }

    private fun parseMtnMessage(body: String, sender: String) {
        val amountRegex = Regex("RWF\\s+([0-9,]+(\\.\\d+)?)")
        val refRegex = Regex("Ref:\\s*([A-Z0-9]+)", RegexOption.IGNORE_CASE)
        val phoneRegex = Regex("from\\s+(\\d+)", RegexOption.IGNORE_CASE)
        val amount = amountRegex.find(body)?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()
        val reference = refRegex.find(body)?.groupValues?.get(1) ?: System.currentTimeMillis().toString()
        val phone = phoneRegex.find(body)?.groupValues?.get(1)
        if (amount != null) {
            repository.addTransaction(
                MomoTransaction(
                    provider = "MTN",
                    amount = amount,
                    reference = reference,
                    senderPhone = phone ?: sender,
                    timestamp = System.currentTimeMillis(),
                    messageBody = body
                )
            )
        }
    }

    private fun parseAirtelMessage(body: String, sender: String) {
        val amountRegex = Regex("RWF\\s+([0-9,]+(\\.\\d+)?)")
        val refRegex = Regex("Transaction ID:\\s*([A-Z0-9]+)", RegexOption.IGNORE_CASE)
        val phoneRegex = Regex("from\\s+(\\d+)", RegexOption.IGNORE_CASE)
        val amount = amountRegex.find(body)?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()
        val reference = refRegex.find(body)?.groupValues?.get(1) ?: System.currentTimeMillis().toString()
        val phone = phoneRegex.find(body)?.groupValues?.get(1)
        if (amount != null) {
            repository.addTransaction(
                MomoTransaction(
                    provider = "Airtel",
                    amount = amount,
                    reference = reference,
                    senderPhone = phone ?: sender,
                    timestamp = System.currentTimeMillis(),
                    messageBody = body
                )
            )
        }
    }
}
