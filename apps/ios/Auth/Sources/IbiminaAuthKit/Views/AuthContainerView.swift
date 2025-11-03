import SwiftUI

public struct AuthContainerView: View {
    @StateObject private var viewModel: AuthViewModel

    public init(viewModel: AuthViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    public var body: some View {
        Group {
            switch viewModel.step {
            case .start:
                StartAuthView(viewModel: viewModel)
            case .verify:
                VerifyAuthView(viewModel: viewModel)
            case .complete:
                VStack(spacing: 24) {
                    Text("Authenticated")
                        .font(.title)
                        .bold()
                    if let token = viewModel.token {
                        Text("Stored token: \(token.prefix(8))…")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Button("Sign out", action: viewModel.signOut)
                }
                .padding()
            }
        }
        .animation(.easeInOut, value: viewModel.step)
    }
}
