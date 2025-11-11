package rw.gov.ikanisa.ibimina.client.data.transactions

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val merchantName: String,
    val merchantAccount: String,
    val amountMinor: Long,
    val currency: String,
    val note: String,
    val nonce: String,
    val signedAt: Long,
    val signature: String,
    val payload: String
)
