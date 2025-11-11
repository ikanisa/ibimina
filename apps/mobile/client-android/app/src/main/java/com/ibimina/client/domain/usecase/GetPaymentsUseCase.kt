package com.ibimina.client.domain.usecase

import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.repository.PaymentRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use case for retrieving user payments
 */
class GetPaymentsUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    suspend operator fun invoke(userId: String): Flow<List<Payment>> {
        return paymentRepository.getPayments(userId)
    }
}
