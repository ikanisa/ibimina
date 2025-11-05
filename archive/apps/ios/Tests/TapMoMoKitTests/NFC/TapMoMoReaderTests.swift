import XCTest
@testable import TapMoMoKit

final class TapMoMoReaderTests: XCTestCase {
    func testValidPayloadCompletesSuccessfully() throws {
        let config = TapMoMoConfig(
            requireSignature: true,
            allowUnsignedWithWarning: false,
            merchantSecrets: ["MERCHANT1": "top-secret"]
        )
        let nonceStore = InMemoryNonceStore()
        let time = FixedTimeProvider(date: Date(timeIntervalSince1970: 1_700_000_000))
        let configProvider = NfcTestConfigProvider(config: config, nonceStore: nonceStore)
        let validator = PayloadValidator(configProvider: configProvider, timeProvider: time, nonceStore: nonceStore)

        let payload = PaymentPayload(
            network: .mtn,
            merchantId: "MERCHANT1",
            currency: "RWF",
            amount: 2500,
            ref: "INV-123",
            ts: Int64(time.date.timeIntervalSince1970 * 1000),
            nonce: "nonce-1",
            sig: CryptoUtils.hmacSha256(
                message: CryptoUtils.createSignableMessage(
                    ver: 1,
                    network: Network.mtn.rawValue,
                    merchantId: "MERCHANT1",
                    currency: "RWF",
                    amount: 2500,
                    ref: "INV-123",
                    ts: Int64(time.date.timeIntervalSince1970 * 1000),
                    nonce: "nonce-1"
                ),
                secret: "top-secret"
            )
        )

        let data = try JSONEncoder().encode(payload)
        let tag = StubISO7816Tag(result: .success(ISO7816Response(data: data, sw1: 0x90, sw2: 0x00)))
        let sessionProvider = StubTagReaderSessionProvider(isAvailable: true, simulatedTag: tag)
        let reader = TapMoMoReader(
            validator: validator,
            sessionProvider: sessionProvider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Reader completes")
        reader.startReading { result in
            switch result {
            case .success(let outcome):
                if case let .valid(returnedPayload) = outcome {
                    XCTAssertEqual(returnedPayload, payload)
                } else {
                    XCTFail("Expected valid outcome")
                }
            case .failure(let error):
                XCTFail("Unexpected error: \(error)")
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
        XCTAssertTrue(nonceStore.hasSeenNonce("nonce-1"))
    }

    func testUnsignedPayloadProducesWarning() throws {
        let config = TapMoMoConfig(
            requireSignature: true,
            allowUnsignedWithWarning: true
        )
        let nonceStore = InMemoryNonceStore()
        let time = FixedTimeProvider(date: Date())
        let configProvider = NfcTestConfigProvider(config: config, nonceStore: nonceStore)
        let validator = PayloadValidator(configProvider: configProvider, timeProvider: time, nonceStore: nonceStore)

        let unsignedPayload = PaymentPayload(
            network: .airtel,
            merchantId: "M2",
            currency: "RWF",
            amount: nil,
            ref: nil,
            ts: Int64(time.date.timeIntervalSince1970 * 1000),
            nonce: "nonce-2",
            sig: nil
        )

        let data = try JSONEncoder().encode(unsignedPayload)
        let tag = StubISO7816Tag(result: .success(ISO7816Response(data: data, sw1: 0x90, sw2: 0x00)))
        let sessionProvider = StubTagReaderSessionProvider(isAvailable: true, simulatedTag: tag)
        let reader = TapMoMoReader(
            validator: validator,
            sessionProvider: sessionProvider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Warning returned")
        reader.startReading { result in
            switch result {
            case .success(let outcome):
                switch outcome {
                case .unsignedWarning(let payload, let message):
                    XCTAssertEqual(payload, unsignedPayload)
                    XCTAssertEqual(message, "Payment signature missing")
                default:
                    XCTFail("Expected unsigned warning")
                }
            case .failure(let error):
                XCTFail("Unexpected error: \(error)")
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
        XCTAssertFalse(nonceStore.hasSeenNonce("nonce-2"))
    }

    func testInvalidStatusWordFails() throws {
        let config = TapMoMoConfig()
        let nonceStore = InMemoryNonceStore()
        let time = FixedTimeProvider(date: Date())
        let configProvider = NfcTestConfigProvider(config: config, nonceStore: nonceStore)
        let validator = PayloadValidator(configProvider: configProvider, timeProvider: time, nonceStore: nonceStore)

        let payload = PaymentPayload(
            network: .mtn,
            merchantId: "MERCHANT",
            currency: "RWF",
            amount: 1000,
            ref: nil,
            ts: Int64(time.date.timeIntervalSince1970 * 1000),
            nonce: "nonce-3",
            sig: nil
        )
        let data = try JSONEncoder().encode(payload)
        let tag = StubISO7816Tag(result: .success(ISO7816Response(data: data, sw1: 0x6A, sw2: 0x82)))
        let sessionProvider = StubTagReaderSessionProvider(isAvailable: true, simulatedTag: tag)
        let reader = TapMoMoReader(
            validator: validator,
            sessionProvider: sessionProvider,
            completionQueue: .main
        )

        let expectation = expectation(description: "Failure returned")
        reader.startReading { result in
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error, .invalidStatusWord(sw1: 0x6A, sw2: 0x82))
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
    }

    func testUnavailableSessionFailsImmediately() {
        let sessionProvider = StubTagReaderSessionProvider(isAvailable: false, simulatedTag: nil)
        let validator = PayloadValidator(configProvider: NfcTestConfigProvider(config: TapMoMoConfig(), nonceStore: InMemoryNonceStore()))
        let reader = TapMoMoReader(validator: validator, sessionProvider: sessionProvider, completionQueue: .main)

        let expectation = expectation(description: "Unavailable error")
        reader.startReading { result in
            switch result {
            case .success:
                XCTFail("Expected error")
            case .failure(let error):
                XCTAssertEqual(error, .nfcUnavailable)
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
    }

    func testUnsupportedTagFails() {
        let sessionProvider = StubTagReaderSessionProvider(isAvailable: true, simulatedTag: nil)
        sessionProvider.shouldReportUnsupported = true
        let validator = PayloadValidator(configProvider: NfcTestConfigProvider(config: TapMoMoConfig(), nonceStore: InMemoryNonceStore()))
        let reader = TapMoMoReader(validator: validator, sessionProvider: sessionProvider, completionQueue: .main)

        let expectation = expectation(description: "Unsupported tag")
        reader.startReading { result in
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error, .unsupportedTag)
            }
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
    }
}

private final class StubTagReaderSessionProvider: TagReaderSessionProvider {
    var isAvailable: Bool
    var simulatedTag: ISO7816TagCommunicating?
    var shouldReportUnsupported = false
    private(set) var invalidatedMessage: String?
    private(set) var alertMessages: [String] = []
    private var delegate: TagReaderSessionDelegate?

    init(isAvailable: Bool, simulatedTag: ISO7816TagCommunicating?) {
        self.isAvailable = isAvailable
        self.simulatedTag = simulatedTag
    }

    func setAlertMessage(_ message: String) {
        alertMessages.append(message)
    }

    func beginSession(delegate: TagReaderSessionDelegate) {
        self.delegate = delegate
        if let simulatedTag {
            delegate.tagReaderSession(self, didDetect: simulatedTag)
        } else if shouldReportUnsupported {
            delegate.tagReaderSessionDetectedUnsupportedTag(self)
        }
    }

    func invalidateSession(errorMessage: String?) {
        invalidatedMessage = errorMessage
    }
}

private final class StubISO7816Tag: ISO7816TagCommunicating {
    let result: Result<ISO7816Response, Error>

    init(result: Result<ISO7816Response, Error>) {
        self.result = result
    }

    func selectAid(_ aid: Data, completion: @escaping (Result<ISO7816Response, Error>) -> Void) {
        completion(result)
    }
}

private final class NfcTestConfigProvider: ConfigProviding {
    var currentConfig: TapMoMoConfig
    let nonceStore: NonceStore

    init(config: TapMoMoConfig, nonceStore: NonceStore) {
        self.currentConfig = config
        self.nonceStore = nonceStore
    }

    func merchantSecret(for merchantId: String) -> String? {
        currentConfig.merchantSecrets[merchantId]
    }
}

private struct FixedTimeProvider: TimeProviding {
    let date: Date
    init(date: Date) {
        self.date = date
    }
    func now() -> Date { date }
}
