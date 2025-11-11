package com.ibimina.client.domain.usecase

import com.ibimina.client.domain.model.Payment
import com.ibimina.client.domain.model.PaymentStatus
import com.ibimina.client.domain.repository.PaymentRepository
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test
import org.mockito.Mockito.*

/**
 * Unit tests for payment use cases
 */
class PaymentUseCaseTest {
    
    @Test
    fun `test GetPaymentsUseCase returns payments`() = runTest {
        // Mock repository
        val mockRepository = mock(PaymentRepository::class.java)
        val testPayments = listOf(
            Payment(
                id = "1",
                amount = 5000.0,
                reference = "REF001",
                merchantCode = "MERCHANT123",
                network = "MTN",
                timestamp = System.currentTimeMillis(),
                status = PaymentStatus.SETTLED
            )
        )
        
        `when`(mockRepository.getPayments("user123")).thenReturn(flowOf(testPayments))
        
        // Test use case
        val useCase = GetPaymentsUseCase(mockRepository)
        val result = useCase("user123").first()
        
        assertEquals(1, result.size)
        assertEquals("REF001", result[0].reference)
        verify(mockRepository, times(1)).getPayments("user123")
    }
    
    @Test
    fun `test CreatePaymentUseCase creates payment`() = runTest {
        // Mock repository
        val mockRepository = mock(PaymentRepository::class.java)
        val testPayment = Payment(
            id = "1",
            amount = 5000.0,
            reference = "REF001",
            merchantCode = "MERCHANT123",
            network = "MTN",
            timestamp = System.currentTimeMillis(),
            status = PaymentStatus.INITIATED
        )
        
        `when`(mockRepository.createPayment(testPayment))
            .thenReturn(Result.success(testPayment))
        
        // Test use case
        val useCase = CreatePaymentUseCase(mockRepository)
        val result = useCase(testPayment)
        
        assertTrue(result.isSuccess)
        assertEquals(testPayment, result.getOrNull())
        verify(mockRepository, times(1)).createPayment(testPayment)
    }
}
