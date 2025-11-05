import Combine
import Foundation

public enum AuthStep {
    case start
    case verify
    case complete
}

@MainActor
public final class AuthViewModel: ObservableObject {
    @Published public private(set) var step: AuthStep = .start
    @Published public private(set) var isLoading = false
    @Published public private(set) var isResending = false
    @Published public private(set) var errorMessage: String?
    @Published public private(set) var countdown: Int = 0
    @Published public private(set) var whatsappNumber: String = ""
    @Published public private(set) var attemptId: String?
    @Published public private(set) var token: String?

    private let api: AuthNetworking
    private let tokenStore: TokenStoring
    private var countdownCancellable: AnyCancellable?

    public init(api: AuthNetworking, tokenStore: TokenStoring) {
        self.api = api
        self.tokenStore = tokenStore
        if let token = try? tokenStore.load() {
            self.token = token
            self.step = .complete
        }
    }

    public func start(number: String) {
        guard !number.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isLoading = true
        errorMessage = nil
        let sanitized = number.trimmingCharacters(in: .whitespacesAndNewlines)
        Task {
            do {
                let response = try await api.start(number: sanitized)
                whatsappNumber = sanitized
                attemptId = response.attemptId
                isLoading = false
                step = .verify
                beginCountdown(seconds: response.resendIn ?? 60)
            } catch {
                isLoading = false
                errorMessage = error.localizedDescription
            }
        }
    }

    public func verify(code: String) {
        guard step == .verify, !code.isEmpty, let attemptId else { return }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let response = try await api.verify(number: whatsappNumber, code: code, attemptId: attemptId)
                try tokenStore.save(token: response.token)
                token = response.token
                step = .complete
                isLoading = false
                countdownCancellable?.cancel()
            } catch {
                isLoading = false
                errorMessage = error.localizedDescription
            }
        }
    }

    public func resend() {
        guard step == .verify, !isResending, countdown == 0 else { return }
        isResending = true
        errorMessage = nil
        Task {
            do {
                let response = try await api.start(number: whatsappNumber)
                attemptId = response.attemptId
                beginCountdown(seconds: response.resendIn ?? 60)
                isResending = false
            } catch {
                errorMessage = error.localizedDescription
                isResending = false
            }
        }
    }

    public func signOut() {
        Task {
            try? tokenStore.clear()
            token = nil
            attemptId = nil
            whatsappNumber = ""
            step = .start
        }
    }

    private func beginCountdown(seconds: Int) {
        countdownCancellable?.cancel()
        countdown = max(seconds, 0)
        guard countdown > 0 else { return }

        countdownCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self else { return }
                if self.countdown <= 1 {
                    self.countdown = 0
                    self.countdownCancellable?.cancel()
                } else {
                    self.countdown -= 1
                }
            }
    }
}
