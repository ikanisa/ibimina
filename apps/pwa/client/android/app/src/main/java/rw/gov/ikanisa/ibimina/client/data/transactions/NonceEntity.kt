package rw.gov.ikanisa.ibimina.client.data.transactions

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "nonce_cache")
data class NonceEntity(
    @PrimaryKey val nonce: String,
    val createdAt: Long
)
