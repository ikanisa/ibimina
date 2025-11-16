import SwiftUI

struct AuthFlowView: View {
    @StateObject private var viewModel = AuthFlowViewModel()

    var body: some View {
        VStack(spacing: 24) {
            Text(viewModel.title)
                .font(.title)
                .bold()
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(viewModel.subtitle)
                .font(.body)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            if viewModel.step == .phoneEntry {
                TextField("WhatsApp number", text: $viewModel.phoneNumber)
                    .textContentType(.telephoneNumber)
                    .keyboardType(.phonePad)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
            } else {
                TextField("6-digit code", text: $viewModel.otpCode)
                    .keyboardType(.numberPad)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                Text("Sent to \(viewModel.phoneNumber)")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button {
                Task { await viewModel.primaryAction() }
            } label: {
                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .frame(maxWidth: .infinity)
                } else {
                    Text(viewModel.primaryButtonTitle)
                        .frame(maxWidth: .infinity)
                }
            }
            .disabled(viewModel.isLoading)
            .buttonStyle(.borderedProminent)

            if viewModel.step == .otpEntry {
                Button("Resend code") {
                    Task { await viewModel.resendCode() }
                }
                .disabled(viewModel.isLoading)

                Button("Use a different number") {
                    viewModel.goBack()
                }
            }
        }
        .padding(24)
    }
}

@MainActor
final class AuthFlowViewModel: ObservableObject {
    enum Step { case phoneEntry, otpEntry }

    @Published var phoneNumber: String = ""
    @Published var otpCode: String = ""
    @Published var step: Step = .phoneEntry
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: SupabaseServiceProtocol

    init(service: SupabaseServiceProtocol = SupabaseService.shared) {
        self.service = service
    }

    var title: String {
        step == .phoneEntry ? "Welcome" : "Enter the code"
    }

    var subtitle: String {
        step == .phoneEntry
            ? "Enter your WhatsApp number to receive a verification code."
            : "We sent a 6-digit code to your WhatsApp."
    }

    var primaryButtonTitle: String {
        step == .phoneEntry ? "Send code" : "Verify"
    }

    func primaryAction() async {
        switch step {
        case .phoneEntry:
            await sendCode()
        case .otpEntry:
            await verifyCode()
        }
    }

    func resendCode() async {
        await sendCode()
    }

    func goBack() {
        step = .phoneEntry
        otpCode = ""
    }

    private func sendCode() async {
        let trimmed = phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            errorMessage = "Please enter your number"
            return
        }
        phoneNumber = trimmed
        isLoading = true
        errorMessage = nil
        do {
            try await service.sendOtp(phoneNumber: trimmed)
            step = .otpEntry
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func verifyCode() async {
        guard otpCode.count == 6 else {
            errorMessage = "Enter the 6-digit code"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await service.verifyOtp(phoneNumber: phoneNumber, code: otpCode)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
