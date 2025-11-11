import Foundation
import Combine
import Supabase

final class SupabaseService: ObservableObject {
    static let shared = SupabaseService()

    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var transactions: [Transaction] = []

    private let client: SupabaseClient
    private var cancellables = Set<AnyCancellable>()

    private init() {
        let url = URL(string: Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? "https://example.supabase.co")!
        let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? "public-anon-key"
        client = SupabaseClient(supabaseURL: url, supabaseKey: key)
    }

    func signInAnonymously() {
        Task {
            do {
                _ = try await client.auth.signInAnonymously()
                await MainActor.run { self.isAuthenticated = true }
            } catch {
                print("[SupabaseService] Failed to authenticate: \(error)")
            }
        }
    }

    func loadTransactions() {
        Task {
            do {
                let response: [Transaction] = try await client.database
                    .from("transactions")
                    .select()
                    .execute()
                    .value
                await MainActor.run {
                    self.transactions = response
                }
            } catch {
                print("[SupabaseService] Failed to load transactions: \(error)")
            }
        }
    }

    func record(transaction: Transaction) {
        Task {
            do {
                _ = try await client.database
                    .from("transactions")
                    .insert(transaction)
                    .execute()
                await MainActor.run {
                    self.transactions.append(transaction)
                }
            } catch {
                print("[SupabaseService] Failed to record transaction: \(error)")
            }
        }
    }
}
