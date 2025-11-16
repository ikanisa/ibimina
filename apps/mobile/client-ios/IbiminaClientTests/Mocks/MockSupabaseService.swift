import Foundation
@testable import IbiminaClient

final class MockSupabaseService: SupabaseServiceProtocol {
    var groupsResult: Result<[Group], Error> = .success([])
    var transactionsResult: Result<[Transaction], Error> = .success([])
    var fetchAllocationResult: Result<Transaction?, Error> = .success(nil)
    private(set) var createAllocationCallCount = 0
    private(set) var lastAllocationRequest: AllocationRequest?
    private(set) var registerPayloadCallCount = 0
    private(set) var markExhaustedCallCount = 0
    private(set) var lastNonce: String?

    func fetchUserGroups(userId: String) async throws -> [Group] {
        try groupsResult.get()
    }

    func fetchTransactions(userId: String) async throws -> [Transaction] {
        try transactionsResult.get()
    }

    func fetchAllocationByReference(reference: String) async throws -> Transaction? {
        try fetchAllocationResult.get()
    }

    func createAllocation(allocation: AllocationRequest) async throws {
        createAllocationCallCount += 1
        lastAllocationRequest = allocation
        if case let .failure(error) = fetchAllocationResult {
            throw error
        }
    }

    func registerTapMomoPayload(_ payload: PaymentData) async throws {
        registerPayloadCallCount += 1
    }

    func markTapMomoPayloadExhausted(nonce: String) async throws {
        markExhaustedCallCount += 1
        lastNonce = nonce
    }
}
