package rw.gov.ikanisa.ibimina.client.data.transactions

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

class TransactionRepository(private val dao: TransactionDao) {

    val transactions: Flow<List<TransactionEntity>> = dao.observeTransactions()

    suspend fun recordTransaction(payload: rw.gov.ikanisa.ibimina.client.nfc.ActivePayload) {
        withContext(Dispatchers.IO) {
            dao.insertTransaction(payload.toTransactionEntity())
        }
    }

    suspend fun registerNonce(nonce: String, createdAtMillis: Long): Boolean {
        return withContext(Dispatchers.IO) {
            dao.pruneNonces(createdAtMillis - NONCE_RETENTION_MS)
            val result = dao.insertNonce(NonceEntity(nonce = nonce, createdAt = createdAtMillis))
            result != -1L
        }
    }

    suspend fun releaseNonce(nonce: String) {
        withContext(Dispatchers.IO) {
            dao.deleteNonce(nonce)
        }
    }

    companion object {
        private const val NONCE_RETENTION_MINUTES = 10
        private val NONCE_RETENTION_MS = NONCE_RETENTION_MINUTES * 60 * 1000L
    }
}
