package rw.gov.ikanisa.ibimina.client.data.transactions

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [TransactionEntity::class, NonceEntity::class],
    version = 1,
    exportSchema = false
)
abstract class PayeeDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao

    companion object {
        @Volatile
        private var INSTANCE: PayeeDatabase? = null

        fun getInstance(context: Context): PayeeDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    PayeeDatabase::class.java,
                    "payee.db"
                ).fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
