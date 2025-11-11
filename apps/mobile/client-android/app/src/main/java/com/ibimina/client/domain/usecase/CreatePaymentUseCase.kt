package com.ibimina.client.domain.usecase

import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.repository.PaymentRepository
import javax.inject.Inject

/**
 * Use case for creating a new payment
 */
class CreatePaymentUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    suspend operator fun invoke(payment: Payment): Result<Payment> {
        return paymentRepository.createPayment(payment)
    }
}
