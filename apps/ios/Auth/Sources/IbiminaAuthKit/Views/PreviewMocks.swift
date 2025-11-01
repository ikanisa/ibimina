import Foundation

final class PreviewAPI: AuthNetworking {
    func start(number: String) async throws -> StartWhatsAppResponse {
        try await Task.sleep(nanoseconds: 100_000_000)
        return StartWhatsAppResponse(attemptId: "preview", expiresIn: 300, resendIn: 60)
    }

    func verify(number: String, code: String, attemptId: String?) async throws -> VerifyWhatsAppResponse {
        try await Task.sleep(nanoseconds: 100_000_000)
        return VerifyWhatsAppResponse(token: "preview-token", refreshToken: nil, expiresIn: 3600)
    }
}

final class InMemoryTokenStore: TokenStoring {
    private var storage: String?

    func save(token: String) throws {
        storage = token
    }

    func load() throws -> String? {
        storage
    }

    func clear() throws {
        storage = nil
    }
}
