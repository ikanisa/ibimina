package rw.gov.ikanisa.ibimina.client.data.transactions

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertTransaction(transaction: TransactionEntity)

    @Query("SELECT * FROM transactions ORDER BY signedAt DESC")
    fun observeTransactions(): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertNonce(nonce: NonceEntity): Long

    @Query("SELECT * FROM nonce_cache WHERE nonce = :nonce LIMIT 1")
    suspend fun findNonce(nonce: String): NonceEntity?

    @Query("DELETE FROM nonce_cache WHERE createdAt < :expiresBefore")
    suspend fun pruneNonces(expiresBefore: Long)

    @Query("DELETE FROM nonce_cache WHERE nonce = :nonce")
    suspend fun deleteNonce(nonce: String)
}
