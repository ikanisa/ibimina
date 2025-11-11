import XCTest
@testable import IbiminaClient

@MainActor
final class ContentViewModelTests: XCTestCase {
    func testPrepareWriterPayloadCreatesAllocation() async throws {
        let mock = MockSupabaseService()
        let viewModel = ContentViewModel(service: mock)

        let payload = try await viewModel.prepareWriterPayload()

        XCTAssertFalse(payload.isEmpty)
        XCTAssertEqual(mock.createAllocationCallCount, 1)
        XCTAssertNotNil(viewModel.paymentData)
    }

    func testHandleReaderPayloadLoadsAllocation() async throws {
        let transaction = Transaction(
            id: "txn-1",
            amount: 5000,
            reference: "REF123",
            status: "completed",
            createdAt: "2024-01-01T00:00:00Z",
            groupId: "group",
            memberId: "demo"
        )
        let mock = MockSupabaseService()
        mock.fetchAllocationResult = .success(transaction)

        let viewModel = ContentViewModel(service: mock)
        let payment = PaymentData.sample(amount: 5000, network: "MTN", merchantId: "org-demo")
        guard let payload = NFCTagHandler.formatPaymentData(payment) else {
            return XCTFail("Failed to encode payment")
        }

        await viewModel.handleReaderPayload(payload)

        XCTAssertEqual(viewModel.paymentData, payment)
        XCTAssertEqual(viewModel.latestAllocation, transaction)
        XCTAssertNil(viewModel.errorMessage)
    }
}
