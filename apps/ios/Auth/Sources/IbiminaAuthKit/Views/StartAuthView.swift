import SwiftUI

public struct StartAuthView: View {
    @ObservedObject private var viewModel: AuthViewModel
    @State private var phoneNumber: String = ""

    public init(viewModel: AuthViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Sign in with WhatsApp")
                .font(.title)
                .bold()

            Text("Enter your WhatsApp number to receive a one-time code.")
                .foregroundStyle(.secondary)

            TextField("2507…", text: $phoneNumber)
                .keyboardType(.phonePad)
                .textFieldStyle(.roundedBorder)

            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }

            Button(action: { viewModel.start(number: phoneNumber) }) {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Send code")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines).count < 9 || viewModel.isLoading)
        }
        .padding()
    }
}

#Preview {
    StartAuthView(viewModel: AuthViewModel(api: PreviewAPI(), tokenStore: InMemoryTokenStore()))
}
