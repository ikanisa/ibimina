package com.tapmomo.feature.data.dao

import androidx.room.*
import com.tapmomo.feature.data.entity.SeenNonceEntity

/**
 * DAO for nonce replay protection
 */
@Dao
interface SeenNonceDao {
    
    @Query("SELECT * FROM seen_nonces WHERE nonce = :nonce")
    suspend fun getNonce(nonce: String): SeenNonceEntity?
    
    @Query("SELECT EXISTS(SELECT 1 FROM seen_nonces WHERE nonce = :nonce)")
    suspend fun hasNonce(nonce: String): Boolean
    
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertNonce(nonce: SeenNonceEntity)
    
    @Query("DELETE FROM seen_nonces WHERE seen_at < :timestamp")
    suspend fun deleteOldNonces(timestamp: Long)
}
