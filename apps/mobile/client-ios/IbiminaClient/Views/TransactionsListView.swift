import SwiftUI
import Supabase

struct TransactionsListView: View {
    @StateObject private var viewModel: TransactionsListViewModel

    init(userId: String, service: SupabaseServiceProtocol = SupabaseService.shared) {
        _viewModel = StateObject(wrappedValue: TransactionsListViewModel(userId: userId, service: service))
    }

    var body: some View {
        List {
            if viewModel.isLoading && viewModel.transactions.isEmpty {
                Section {
                    ProgressView("Loading transactions…")
                        .frame(maxWidth: .infinity)
                }
            } else if viewModel.transactions.isEmpty {
                Section {
                    Label("No transactions found", systemImage: "tray")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 16)
                }
            } else {
                Section("Recent activity") {
                    ForEach(viewModel.transactions) { transaction in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(transaction.amount.formattedCurrency())
                                .font(.headline)
                            HStack {
                                Label(transaction.status.capitalized, systemImage: "checkmark.seal")
                                    .labelStyle(.titleAndIcon)
                                    .font(.subheadline)
                                Spacer()
                                Text(transaction.formattedDate)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            if let group = transaction.groupId {
                                Text("Group: \(group)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                        .accessibilityElement(children: .combine)
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .accessibilityIdentifier("transactions-error")
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Transactions")
        .task { await viewModel.load() }
        .refreshable { await viewModel.load(force: true) }
    }
}

@MainActor
final class TransactionsListViewModel: ObservableObject {
    @Published private(set) var transactions: [Transaction] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let userId: String
    private let service: SupabaseServiceProtocol
    private var didLoadOnce = false

    init(userId: String, service: SupabaseServiceProtocol) {
        self.userId = userId
        self.service = service
    }

    func load(force: Bool = false) async {
        guard force || !didLoadOnce else { return }
        didLoadOnce = true
        await fetchTransactions()
    }

    private func fetchTransactions() async {
        isLoading = true
        defer { isLoading = false }

        do {
            transactions = try await service.fetchTransactions(userId: userId)
            errorMessage = nil
        } catch {
            errorMessage = "Failed to load transactions: \(error.localizedDescription)"
        }
    }
}

private extension Transaction {
    func formattedCurrency(locale: Locale = .current) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = locale
        return formatter.string(from: NSNumber(value: amount)) ?? String(format: "%.2f", amount)
    }

    var formattedDate: String {
        if let date = ISO8601DateFormatter.ibiminaFormatter.date(from: createdAt) {
            return DateFormatter.ibiminaFormatter.string(from: date)
        }
        return createdAt
    }
}

private extension ISO8601DateFormatter {
    static let ibiminaFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}

private extension DateFormatter {
    static let ibiminaFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}

#if DEBUG
private struct PreviewTransactionsService: SupabaseServiceProtocol {
    var currentSession: Session? { nil }
    var memberId: String? { "preview" }
    func fetchUserGroups(userId: String) async throws -> [Group] { [] }

    func fetchTransactions(userId: String) async throws -> [Transaction] {
        [
            Transaction(id: "1", amount: 25000, reference: "REF1", status: "completed", createdAt: "2024-01-01T10:00:00Z", groupId: "grp-1", memberId: "mem-1"),
            Transaction(id: "2", amount: 18000, reference: "REF2", status: "pending", createdAt: "2024-01-05T15:30:00Z", groupId: nil, memberId: "mem-1")
        ]
    }

    func fetchAllocationByReference(reference: String) async throws -> Transaction? { nil }
    func createAllocation(allocation: AllocationRequest) async throws {}
    func sendOtp(phoneNumber: String) async throws {}
    func verifyOtp(phoneNumber: String, code: String) async throws {}
    func signOut() async throws {}
}

struct TransactionsListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            TransactionsListView(userId: "preview", service: PreviewTransactionsService())
        }
    }
}
#endif
