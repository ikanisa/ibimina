import Foundation
import Supabase

/**
 * SupabaseService manages all Supabase interactions for the iOS app
 * 
 * Features:
 * - Database queries
 * - Authentication
 * - Real-time subscriptions
 * - Transaction management
 */
protocol SupabaseServiceProtocol {
    func fetchUserGroups(userId: String) async throws -> [Group]
    func fetchTransactions(userId: String) async throws -> [Transaction]
    func fetchAllocationByReference(reference: String) async throws -> Transaction?
    func createAllocation(allocation: AllocationRequest) async throws
    func registerTapMomoPayload(_ payload: PaymentData) async throws
    func markTapMomoPayloadExhausted(nonce: String) async throws
}

final class SupabaseService: SupabaseServiceProtocol {

    static let shared = SupabaseService()

    private var client: SupabaseClient?
    private let isoFormatter = ISO8601DateFormatter()

    private init() {}
    
    /**
     * Initialize Supabase client
     * Call this in AppDelegate
     */
    func initialize() {
        guard let supabaseURL = URL(string: Configuration.supabaseURL),
              let supabaseKey = Configuration.supabaseAnonKey else {
            fatalError("Supabase configuration is missing")
        }
        
        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )
    }
    
    // MARK: - Authentication
    
    /**
     * Sign in with email and password
     */
    func signIn(email: String, password: String) async throws -> Session {
        return try await requireClient().auth.signIn(email: email, password: password)
    }
    
    /**
     * Sign out current user
     */
    func signOut() async throws {
        try await requireClient().auth.signOut()
    }
    
    /**
     * Get current user session
     */
    func getCurrentSession() async throws -> Session? {
        return try await requireClient().auth.session
    }
    
    // MARK: - Groups (Ibimina)
    
    /**
     * Fetch user's groups
     */
    func fetchUserGroups(userId: String) async throws -> [Group] {
        let response = try await requireClient().database
            .from("group_members")
            .select()
            .eq("user_id", value: userId)
            .execute()
        
        let decoder = JSONDecoder()
        return try decoder.decode([Group].self, from: response.data)
    }
    
    /**
     * Fetch group details
     */
    func fetchGroupDetails(groupId: String) async throws -> GroupDetails {
        let response = try await requireClient().database
            .from("groups")
            .select()
            .eq("id", value: groupId)
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        return try decoder.decode(GroupDetails.self, from: response.data)
    }
    
    // MARK: - Transactions
    
    /**
     * Fetch user's transaction history
     */
    func fetchTransactions(userId: String) async throws -> [Transaction] {
        let response = try await requireClient().database
            .from("allocations")
            .select()
            .eq("member_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
        
        let decoder = JSONDecoder()
        return try decoder.decode([Transaction].self, from: response.data)
    }
    
    /**
     * Create a new allocation
     */
    func createAllocation(allocation: AllocationRequest) async throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(allocation)

        _ = try await requireClient().database
            .from("allocations")
            .insert(data)
            .execute()
    }

    func registerTapMomoPayload(_ payload: PaymentData) async throws {
        let encoder = JSONEncoder()
        let record = TapMomoPayloadRecord(payment: payload, formatter: isoFormatter)
        let data = try encoder.encode(record)

        _ = try await requireClient().database
            .from("tapmomo_transactions")
            .insert(data)
            .execute()
    }

    func markTapMomoPayloadExhausted(nonce: String) async throws {
        _ = try await requireClient().database
            .rpc("mark_tapmomo_payload_exhausted", params: ["nonce": nonce])
            .execute()
    }

    /**
     * Fetch allocation by reference
     */
    func fetchAllocationByReference(reference: String) async throws -> Transaction? {
        let response = try await requireClient().database
            .from("allocations")
            .select()
            .eq("raw_ref", value: reference)
            .maybeSingle()
            .execute()

        guard response.data.count > 0 else {
            return nil
        }

        let decoder = JSONDecoder()
        return try decoder.decode(Transaction.self, from: response.data)
    }

    func submit(payment: PaymentData, context: PaymentContext) async throws -> Transaction? {
        try await createAllocation(allocation: payment.allocationRequest(context: context))
        return try await fetchAllocationByReference(reference: payment.reference)
    }

    private func requireClient() -> SupabaseClient {
        guard let client else {
            fatalError("SupabaseService.initialize() must be called before use")
        }
        return client
    }
}

// MARK: - Configuration

private enum Configuration {
    static var supabaseURL: String? {
        return Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
    }
    
    static var supabaseAnonKey: String? {
        return Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
    }
}

// MARK: - Models

struct Group: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let groupId: String
    let memberCode: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case groupId = "group_id"
        case memberCode = "member_code"
    }
}

struct GroupDetails: Codable, Equatable {
    let id: String
    let name: String
    let orgId: String
    let settings: GroupSettings?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case orgId = "org_id"
        case settings
    }
}

struct GroupSettings: Codable, Equatable {
    let amount: Double?
    let frequency: String?
    let cycle: String?
}

struct Transaction: Codable, Identifiable, Equatable {
    let id: String
    let amount: Double
    let reference: String
    let status: String
    let createdAt: String
    let groupId: String?
    let memberId: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case amount
        case reference = "raw_ref"
        case status
        case createdAt = "created_at"
        case groupId = "group_id"
        case memberId = "member_id"
    }
}

struct AllocationRequest: Codable {
    let orgId: String
    let groupId: String
    let memberId: String
    let amount: Double
    let rawRef: String
    let source: String
    
    enum CodingKeys: String, CodingKey {
        case orgId = "org_id"
        case groupId = "group_id"
        case memberId = "member_id"
        case amount
        case rawRef = "raw_ref"
        case source
    }
}

private struct TapMomoPayloadRecord: Codable {
    enum CodingKeys: String, CodingKey {
        case merchantId = "merchant_id"
        case network
        case amount
        case currency
        case ref
        case status
        case nonce
        case ttlSeconds = "ttl_seconds"
        case expiresAt = "expires_at"
        case payloadSignature = "payload_signature"
    }

    let merchantId: String
    let network: String
    let amount: Double
    let currency: String
    let ref: String
    let status: String
    let nonce: String
    let ttlSeconds: Int
    let expiresAt: String
    let payloadSignature: String

    init(payment: PaymentData, formatter: ISO8601DateFormatter) {
        merchantId = payment.merchantId
        network = payment.network
        amount = payment.amount
        currency = "RWF"
        ref = payment.reference
        status = "initiated"
        nonce = payment.nonce
        ttlSeconds = payment.ttlSeconds
        expiresAt = formatter.string(from: Date(timeIntervalSince1970: payment.expiresAt))
        payloadSignature = payment.signature ?? ""
    }
}

private struct TapMomoPayloadUpdate: Codable {
    enum CodingKeys: String, CodingKey {
        case status
        case isExhausted = "is_exhausted"
        case exhaustedAt = "exhausted_at"
    }

    let status = "pending"
    let isExhausted = true
    let exhaustedAt: String

    init(formatter: ISO8601DateFormatter) {
        exhaustedAt = formatter.string(from: Date())
    }
}
