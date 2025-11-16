package com.ibimina.staff.data.momo

import com.ibimina.staff.domain.momo.MomoTransaction
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

@Singleton
class InMemoryMomoTransactionRepository @Inject constructor() : MomoTransactionRepository {
    private val _transactions = MutableStateFlow<List<MomoTransaction>>(emptyList())
    override val transactions: StateFlow<List<MomoTransaction>> = _transactions.asStateFlow()

    override fun addTransaction(transaction: MomoTransaction) {
        _transactions.update { current ->
            (listOf(transaction) + current).distinctBy { it.reference to it.timestamp }
        }
    }
}
