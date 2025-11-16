import Combine
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
    var currentSession: Session? { get }
    var memberId: String? { get }
    func fetchUserGroups(userId: String) async throws -> [Group]
    func fetchTransactions(userId: String) async throws -> [Transaction]
    func fetchAllocationByReference(reference: String) async throws -> Transaction?
    func createAllocation(allocation: AllocationRequest) async throws
    func sendOtp(phoneNumber: String) async throws
    func verifyOtp(phoneNumber: String, code: String) async throws
    func signOut() async throws
}

@MainActor
final class SupabaseService: ObservableObject, SupabaseServiceProtocol {

    static let shared = SupabaseService()

    private var client: SupabaseClient?
    @Published private(set) var session: Session?
    private let sessionStore = SecureSessionStore()

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

        if let storedSession = sessionStore.load() {
            Task {
                try? await client?.auth.setSession(
                    accessToken: storedSession.accessToken,
                    refreshToken: storedSession.refreshToken
                )
                await MainActor.run {
                    self.session = storedSession
                }
            }
        }
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
        sessionStore.clear()
        session = nil
    }
    
    /**
     * Get current user session
     */
    func getCurrentSession() async throws -> Session? {
        return try await requireClient().auth.session
    }

    var currentSession: Session? {
        session
    }

    var memberId: String? {
        session?.user?.userMetadata["member_id"]?.stringValue ?? session?.user?.id.uuidString
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

    func sendOtp(phoneNumber: String) async throws {
        let payload = OTPSendRequest(phoneNumber: phoneNumber)
        let data = try await invokeFunction(name: "whatsapp-otp-send", payload: payload)
        let response = try JSONDecoder().decode(OTPSendResponse.self, from: data)
        if response.success == false {
            throw NSError(domain: "otp.send", code: -1, userInfo: [NSLocalizedDescriptionKey: response.message ?? "Failed to send code"])
        }
    }

    func verifyOtp(phoneNumber: String, code: String) async throws {
        let payload = OTPVerifyRequest(phoneNumber: phoneNumber, code: code)
        let data = try await invokeFunction(name: "whatsapp-otp-verify", payload: payload)
        let response = try JSONDecoder().decode(OTPVerifyResponse.self, from: data)
        guard response.success, let session = response.session else {
            throw NSError(domain: "otp.verify", code: -1, userInfo: [NSLocalizedDescriptionKey: response.message ?? "Invalid code"])
        }
        try await requireClient().auth.setSession(accessToken: session.accessToken, refreshToken: session.refreshToken)
        sessionStore.save(session)
        self.session = session
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

    private func invokeFunction<T: Encodable>(name: String, payload: T) async throws -> Data {
        guard let baseURL = URL(string: Configuration.supabaseURL),
              let key = Configuration.supabaseAnonKey else {
            fatalError("Supabase configuration is missing")
        }

        var request = URLRequest(url: baseURL.appendingPathComponent("functions/v1/" + name))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        request.addValue(key, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unexpected error"
            throw NSError(domain: "otp.function", code: (response as? HTTPURLResponse)?.statusCode ?? -1, userInfo: [NSLocalizedDescriptionKey: message])
        }
        return data
    }
}

private struct OTPSendRequest: Encodable {
    let phoneNumber: String

    enum CodingKeys: String, CodingKey {
        case phoneNumber = "phone_number"
    }
}

private struct OTPSendResponse: Decodable {
    let success: Bool
    let message: String?
}

private struct OTPVerifyRequest: Encodable {
    let phoneNumber: String
    let code: String

    enum CodingKeys: String, CodingKey {
        case phoneNumber = "phone_number"
        case code
    }
}

private struct OTPVerifyResponse: Decodable {
    let success: Bool
    let message: String?
    let session: Session?
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
