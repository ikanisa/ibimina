import SwiftUI
import Supabase

struct GroupsListView: View {
    @StateObject private var viewModel: GroupsListViewModel

    init(userId: String, service: SupabaseServiceProtocol = SupabaseService.shared) {
        _viewModel = StateObject(wrappedValue: GroupsListViewModel(userId: userId, service: service))
    }

    var body: some View {
        List {
            if viewModel.isLoading && viewModel.groups.isEmpty {
                Section {
                    ProgressView("Loading groups…")
                        .frame(maxWidth: .infinity)
                }
            } else if viewModel.groups.isEmpty {
                Section {
                    Label("No groups yet", systemImage: "person.3")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 16)
                }
            } else {
                Section("My Ibimina groups") {
                    ForEach(viewModel.groups) { group in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(group.name)
                                .font(.headline)
                            Text("Member code: \(group.memberCode)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .accessibilityIdentifier("groups-error")
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Groups")
        .task { await viewModel.load() }
        .refreshable { await viewModel.load(force: true) }
    }
}

@MainActor
final class GroupsListViewModel: ObservableObject {
    @Published private(set) var groups: [Group] = []
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
        await fetchGroups()
    }

    private func fetchGroups() async {
        isLoading = true
        defer { isLoading = false }

        do {
            groups = try await service.fetchUserGroups(userId: userId)
            errorMessage = nil
        } catch {
            errorMessage = "Failed to load groups: \(error.localizedDescription)"
        }
    }
}

#if DEBUG
private struct PreviewSupabaseService: SupabaseServiceProtocol {
    var currentSession: Session? { nil }
    var memberId: String? { "preview" }
    func fetchUserGroups(userId: String) async throws -> [Group] {
        [
            Group(id: "1", name: "Village Savings", groupId: "grp-1", memberCode: "M-001"),
            Group(id: "2", name: "Sunday Chama", groupId: "grp-2", memberCode: "M-002")
        ]
    }

    func fetchTransactions(userId: String) async throws -> [Transaction] { [] }
    func fetchAllocationByReference(reference: String) async throws -> Transaction? { nil }
    func createAllocation(allocation: AllocationRequest) async throws {}
    func sendOtp(phoneNumber: String) async throws {}
    func verifyOtp(phoneNumber: String, code: String) async throws {}
    func signOut() async throws {}
}

struct GroupsListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GroupsListView(userId: "preview", service: PreviewSupabaseService())
        }
    }
}
#endif
