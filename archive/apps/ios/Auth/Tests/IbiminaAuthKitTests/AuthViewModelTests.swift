import XCTest
@testable import IbiminaAuthKit

final class MockAPI: AuthNetworking {
    var startResponses: [StartWhatsAppResponse] = []
    var verifyResponses: [VerifyWhatsAppResponse] = []

    func start(number: String) async throws -> StartWhatsAppResponse {
        if startResponses.isEmpty { throw NSError(domain: "test", code: -1) }
        return startResponses.removeFirst()
    }

    func verify(number: String, code: String, attemptId: String?) async throws -> VerifyWhatsAppResponse {
        if verifyResponses.isEmpty { throw NSError(domain: "test", code: -1) }
        return verifyResponses.removeFirst()
    }
}

final class MemoryTokenStore: TokenStoring {
    private var token: String?

    func save(token: String) throws {
        self.token = token
    }

    func load() throws -> String? {
        token
    }

    func clear() throws {
        token = nil
    }
}

@MainActor
final class AuthViewModelTests: XCTestCase {
    func testStartFlowMovesToVerify() async {
        let api = MockAPI()
        api.startResponses = [StartWhatsAppResponse(attemptId: "abc", expiresIn: 300, resendIn: 1)]
        let tokenStore = MemoryTokenStore()
        let viewModel = AuthViewModel(api: api, tokenStore: tokenStore)

        viewModel.start(number: "+2507")
        try? await Task.sleep(nanoseconds: 50_000_000)

        XCTAssertEqual(viewModel.step, .verify)
        XCTAssertEqual(viewModel.whatsappNumber, "+2507")
        XCTAssertEqual(viewModel.countdown, 1)
    }

    func testVerifyPersistsToken() async {
        let api = MockAPI()
        api.startResponses = [StartWhatsAppResponse(attemptId: "abc", expiresIn: 300, resendIn: 0)]
        api.verifyResponses = [VerifyWhatsAppResponse(token: "jwt", refreshToken: nil, expiresIn: 3600)]
        let store = MemoryTokenStore()
        let viewModel = AuthViewModel(api: api, tokenStore: store)

        viewModel.start(number: "+2507")
        try? await Task.sleep(nanoseconds: 50_000_000)
        viewModel.verify(code: "1234")
        try? await Task.sleep(nanoseconds: 50_000_000)

        XCTAssertEqual(viewModel.step, .complete)
        XCTAssertEqual(viewModel.token, "jwt")
    }

    func testResendUpdatesCountdown() async {
        let api = MockAPI()
        api.startResponses = [
            StartWhatsAppResponse(attemptId: "abc", expiresIn: 300, resendIn: 0),
            StartWhatsAppResponse(attemptId: "def", expiresIn: 300, resendIn: 2)
        ]
        let store = MemoryTokenStore()
        let viewModel = AuthViewModel(api: api, tokenStore: store)

        viewModel.start(number: "+2507")
        try? await Task.sleep(nanoseconds: 50_000_000)
        viewModel.resend()
        try? await Task.sleep(nanoseconds: 50_000_000)

        XCTAssertEqual(viewModel.attemptId, "def")
        XCTAssertEqual(viewModel.countdown, 2)
    }
}
