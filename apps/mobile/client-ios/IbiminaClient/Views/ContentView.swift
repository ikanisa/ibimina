import SwiftUI
import CoreNFC

/// Main entry point for the Ibimina client experience.
struct ContentView: View {
    @StateObject private var viewModel: ContentViewModel
    @StateObject private var nfcReader = NFCReaderManager()
    @StateObject private var nfcWriter = NFCWriterManager()

    init(memberId: String, service: SupabaseServiceProtocol = SupabaseService.shared) {
        _viewModel = StateObject(wrappedValue: ContentViewModel(userId: memberId, service: service))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    header

                    actionButtons
                        .padding(.horizontal, 24)

                    if let writerStatus = viewModel.writerStatus {
                        statusBanner(text: writerStatus, color: .green)
                    }

                    if let error = viewModel.errorMessage {
                        statusBanner(text: error, color: .red)
                    }

                    if !viewModel.lastScanPayload.isEmpty {
                        scannedPayload
                            .padding(.horizontal, 24)
                    }

                    if let allocation = viewModel.latestAllocation {
                        allocationSummary(allocation)
                            .padding(.horizontal, 24)
                    }

                    if let payment = viewModel.paymentData {
                        paymentSummary(payment)
                            .padding(.horizontal, 24)
                    }

                    if !NFCReaderManager.isAvailable {
                        Text("NFC is not available on this device")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding()
                    }
                }
                .padding(.vertical, 32)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 64))
                .foregroundColor(.blue)

            Text("Ibimina Client")
                .font(.title)
                .fontWeight(.bold)

            Text("Your groups & savings")
                .font(.subheadline)
                .foregroundColor(.gray)
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 16) {
            Button(action: startNFCReader) {
                Label("Scan NFC Payment", systemImage: "wave.3.right")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(!NFCReaderManager.isAvailable)

            Button(action: startNFCWriter) {
                Label("Create Payment Tag", systemImage: "square.and.arrow.down")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(!NFCWriterManager.isAvailable)

            NavigationLink {
                GroupsListView(userId: viewModel.userId)
            } label: {
                Label("My Groups", systemImage: "person.3")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }

            NavigationLink {
                TransactionsListView(userId: viewModel.userId)
            } label: {
                Label("Transaction History", systemImage: "list.bullet.rectangle")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
    }

    private var scannedPayload: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last scanned payload")
                .font(.caption)
                .foregroundColor(.gray)

            Text(viewModel.lastScanPayload)
                .font(.system(.body, design: .monospaced))
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                .accessibilityIdentifier("nfc-last-scan")
        }
    }

    private func paymentSummary(_ payment: PaymentData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Payment details")
                .font(.headline)
            HStack {
                Label("Amount", systemImage: "creditcard")
                Spacer()
                Text(payment.amount, format: .currency(code: "UGX"))
            }
            HStack {
                Label("Network", systemImage: "antenna.radiowaves.left.and.right")
                Spacer()
                Text(payment.network)
            }
            HStack {
                Label("Reference", systemImage: "number")
                Spacer()
                Text(payment.reference)
                    .textSelection(.enabled)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .cornerRadius(12)
        .accessibilityIdentifier("payment-summary")
    }

    private func allocationSummary(_ allocation: Transaction?) -> some View {
        Group {
            if let allocation {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Supabase allocation")
                        .font(.headline)
                    Text("Status: \(allocation.status.capitalized)")
                        .font(.subheadline)
                    Text("Reference: \(allocation.reference)")
                        .font(.subheadline)
                        .textSelection(.enabled)
                }
                .padding()
                .background(Color.orange.opacity(0.08))
                .cornerRadius(12)
                .accessibilityIdentifier("allocation-summary")
            }
        }
    }

    private func statusBanner(text: String, color: Color) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundColor(color == .red ? .white : .black)
            .padding()
            .frame(maxWidth: .infinity)
            .background(color.opacity(color == .red ? 0.8 : 0.2))
            .cornerRadius(12)
            .padding(.horizontal, 24)
    }

    // MARK: - NFC Triggers

    private func startNFCReader() {
        viewModel.resetMessages()
        nfcReader.onTagRead = { payload in
            Task { await viewModel.handleReaderPayload(payload) }
        }
        nfcReader.onError = { error in
            Task { await viewModel.handleReaderError(error) }
        }
        nfcReader.beginScanning()
    }

    private func startNFCWriter() {
        viewModel.resetMessages()
        Task {
            do {
                let payload = try await viewModel.prepareWriterPayload()
                nfcWriter.onWriteSuccess = {
                    Task { await viewModel.handleWriterSuccess() }
                }
                nfcWriter.onWriteError = { error in
                    Task { await viewModel.handleWriterError(error) }
                }
                nfcWriter.beginWriting(data: payload)
            } catch {
                await viewModel.register(error: error)
            }
        }
    }
}

// MARK: - View Model

@MainActor
final class ContentViewModel: ObservableObject {
    @Published var lastScanPayload: String = ""
    @Published var writerStatus: String?
    @Published var errorMessage: String?
    @Published var paymentData: PaymentData?
    @Published var latestAllocation: Transaction?

    let userId: String
    private let context: PaymentContext
    private let service: SupabaseServiceProtocol

    init(
        userId: String = "",
        context: PaymentContext? = nil,
        service: SupabaseServiceProtocol = SupabaseService.shared
    ) {
        self.userId = userId
        self.service = service
        self.context = context ?? PaymentContext(
            orgId: "org-demo",
            groupId: "group-demo",
            memberId: userId,
            sourceNetwork: "MTN"
        )
    }

    func resetMessages() {
        errorMessage = nil
        writerStatus = nil
    }

    func handleReaderPayload(_ payload: String) async {
        lastScanPayload = payload
        writerStatus = nil

        guard NFCTagHandler.validatePaymentData(payload) else {
            errorMessage = "Invalid payment payload"
            return
        }

        guard let payment = NFCTagHandler.parsePaymentData(payload) else {
            errorMessage = "Unable to decode payment"
            return
        }

        paymentData = payment

        if NFCTagHandler.isPaymentExpired(payment) {
            errorMessage = "Payment request expired (over 2 minutes old)"
            return
        }

        do {
            latestAllocation = try await service.fetchAllocationByReference(reference: payment.reference)
            errorMessage = nil
        } catch {
            errorMessage = "Failed to verify payment: \(error.localizedDescription)"
        }
    }

    func handleReaderError(_ message: String) {
        errorMessage = message
    }

    func prepareWriterPayload() async throws -> String {
        let payment = PaymentData.sample(network: context.sourceNetwork, merchantId: context.orgId)
        paymentData = payment

        guard let payload = NFCTagHandler.formatPaymentData(payment) else {
            throw WriterError.encodingFailed
        }

        do {
            try await service.createAllocation(allocation: payment.allocationRequest(context: context))
            latestAllocation = try await service.fetchAllocationByReference(reference: payment.reference)
        } catch {
            throw WriterError.allocationFailed(error)
        }

        return payload
    }

    func handleWriterSuccess() {
        writerStatus = "Payment tag created successfully"
    }

    func handleWriterError(_ message: String) {
        errorMessage = message
    }

    func register(error: Error) async {
        errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
    }

    enum WriterError: LocalizedError {
        case encodingFailed
        case allocationFailed(Error)

        var errorDescription: String? {
            switch self {
            case .encodingFailed:
                return "Failed to encode payment data"
            case .allocationFailed(let error):
                return "Unable to register payment: \(error.localizedDescription)"
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(memberId: "preview")
    }
}
