import XCTest
@testable import TapMoMoKit

final class UssdConfirmationFlowTests: XCTestCase {
    func testCopiesCodeAndOpensDialer() {
        let config = TapMoMoConfig()
        let provider = UssdTestConfigProvider(config: config)
        let pasteboard = StubPasteboard()
        let dialer = StubDialer(canOpen: true, openResult: true)
        let flow = UssdConfirmationFlow(
            pasteboard: pasteboard,
            dialer: dialer,
            configProvider: provider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Dialer launched")
        flow.start(network: .mtn, merchantId: "12345", amount: 5000) { result in
            switch result {
            case .success(let outcome):
                XCTAssertEqual(outcome.ussdCode, "*182*8*1*12345*5000#")
                XCTAssertTrue(outcome.instructions.contains("Paste"))
            case .failure(let error):
                XCTFail("Unexpected error: \(error)")
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
        XCTAssertEqual(pasteboard.stored, "*182*8*1*12345*5000#")
        XCTAssertEqual(dialer.openedURL?.absoluteString, "tel://")
    }

    func testDialerUnavailableReturnsError() {
        let config = TapMoMoConfig()
        let provider = UssdTestConfigProvider(config: config)
        let pasteboard = StubPasteboard()
        let dialer = StubDialer(canOpen: false, openResult: false)
        let flow = UssdConfirmationFlow(
            pasteboard: pasteboard,
            dialer: dialer,
            configProvider: provider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Dialer unavailable")
        flow.start(network: .mtn, merchantId: "12345", amount: nil) { result in
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error, .cannotOpenDialer)
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
        XCTAssertEqual(pasteboard.stored, "*182*8*1#")
    }

    func testUnsupportedNetworkFails() {
        var config = TapMoMoConfig()
        config.ussdTemplates = [:]
        let provider = UssdTestConfigProvider(config: config)
        let pasteboard = StubPasteboard()
        let dialer = StubDialer(canOpen: true, openResult: true)
        let flow = UssdConfirmationFlow(
            pasteboard: pasteboard,
            dialer: dialer,
            configProvider: provider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Unsupported network")
        flow.start(network: .mtn, merchantId: "12345", amount: nil) { result in
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error, .unsupportedNetwork)
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
        XCTAssertNil(pasteboard.stored)
        XCTAssertNil(dialer.openedURL)
    }
}

private final class StubPasteboard: PasteboardWriting {
    private(set) var stored: String?
    func setString(_ value: String?) {
        stored = value
    }
}

private final class StubDialer: UssdDialerOpening {
    let canOpenValue: Bool
    let openResult: Bool
    private(set) var openedURL: URL?

    init(canOpen: Bool, openResult: Bool) {
        self.canOpenValue = canOpen
        self.openResult = openResult
    }

    func canOpen(_ url: URL) -> Bool {
        canOpenValue
    }

    func open(_ url: URL, completion: @escaping (Bool) -> Void) {
        openedURL = url
        completion(openResult)
    }
}

private final class UssdTestConfigProvider: ConfigProviding {
    var currentConfig: TapMoMoConfig
    let nonceStore: NonceStore = InMemoryNonceStore()

    init(config: TapMoMoConfig) {
        self.currentConfig = config
    }

    func merchantSecret(for merchantId: String) -> String? {
        currentConfig.merchantSecrets[merchantId]
    }
}
