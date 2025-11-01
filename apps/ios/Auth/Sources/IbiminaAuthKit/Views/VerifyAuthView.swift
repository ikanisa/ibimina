import SwiftUI

public struct VerifyAuthView: View {
    @ObservedObject private var viewModel: AuthViewModel
    @State private var code: String = ""

    public init(viewModel: AuthViewModel) {
        self.viewModel = viewModel
    }

    private var formattedCountdown: String {
        let minutes = viewModel.countdown / 60
        let seconds = viewModel.countdown % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Check WhatsApp")
                .font(.title2)
                .bold()

            Text("We sent a code to \(viewModel.whatsappNumber). Enter it below.")
                .foregroundStyle(.secondary)

            TextField("123456", text: $code)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)

            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }

            Button(action: { viewModel.verify(code: code) }) {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Verify and continue")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(code.trimmingCharacters(in: .whitespacesAndNewlines).count < 4 || viewModel.isLoading)

            if viewModel.countdown > 0 {
                Text("Resend available in \(formattedCountdown)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Button("Resend code") {
                viewModel.resend()
            }
            .disabled(viewModel.countdown > 0 || viewModel.isResending)
        }
        .padding()
    }
}

#Preview {
    VerifyAuthView(viewModel: AuthViewModel(api: PreviewAPI(), tokenStore: InMemoryTokenStore()))
}
