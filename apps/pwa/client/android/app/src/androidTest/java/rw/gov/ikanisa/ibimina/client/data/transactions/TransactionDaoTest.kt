package rw.gov.ikanisa.ibimina.client.data.transactions

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import rw.gov.ikanisa.ibimina.client.nfc.ActivePayload

@RunWith(AndroidJUnit4::class)
class TransactionDaoTest {

    private lateinit var database: PayeeDatabase
    private lateinit var repository: TransactionRepository

    @Before
    fun setup() {
        database = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            PayeeDatabase::class.java
        ).allowMainThreadQueries().build()
        repository = TransactionRepository(database.transactionDao())
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun insertsTransaction() = runTest {
        val payload = ActivePayload(
            payloadJson = "{}",
            signatureBase64 = "ZmFrZVNpZw==",
            merchantAccount = "001",
            merchantName = "Corner Shop",
            amountMinor = 1500,
            currency = "RWF",
            note = null,
            nonce = "nonce-1",
            issuedAtMillis = System.currentTimeMillis(),
            expiresAtMillis = System.currentTimeMillis() + 60_000
        )

        repository.recordTransaction(payload)
        val stored = repository.transactions.first()
        assertEquals(1, stored.size)
        assertEquals("Corner Shop", stored[0].merchantName)
        assertEquals("001", stored[0].merchantAccount)
    }

    @Test
    fun preventsNonceReuse() = runTest {
        val now = System.currentTimeMillis()
        assertTrue(repository.registerNonce("nonce-1", now))
        assertFalse(repository.registerNonce("nonce-1", now + 1_000))
        repository.releaseNonce("nonce-1")
        assertTrue(repository.registerNonce("nonce-1", now + 2_000))
    }
}
