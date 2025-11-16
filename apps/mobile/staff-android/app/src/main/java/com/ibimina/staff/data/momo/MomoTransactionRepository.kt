package com.ibimina.staff.data.momo

import com.ibimina.staff.domain.momo.MomoTransaction
import kotlinx.coroutines.flow.StateFlow

interface MomoTransactionRepository {
    val transactions: StateFlow<List<MomoTransaction>>
    fun addTransaction(transaction: MomoTransaction)
}
