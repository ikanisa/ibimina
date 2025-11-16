import XCTest
@testable import IbiminaClient

final class IbiminaClientUITests: XCTestCase {
    func testLaunchShowsPrimaryActions() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.buttons["Scan NFC Payment"].exists)
        XCTAssertTrue(app.buttons["Create Payment Tag"].exists)
    }

    func testValidNfcPayloadRendersSummary() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-mockNfcPayload", validPayload()]
        app.launch()

        XCTAssertTrue(app.otherElements["payment-summary"].waitForExistence(timeout: 2))
    }

    func testExpiredPayloadShowsError() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-mockNfcPayload", expiredPayload()]
        app.launch()

        XCTAssertTrue(app.otherElements["error-banner"].waitForExistence(timeout: 2))
    }

    func testInvalidSignatureShowsError() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-mockNfcPayload", invalidSignaturePayload()]
        app.launch()

        XCTAssertTrue(app.otherElements["error-banner"].waitForExistence(timeout: 2))
    }

    private func validPayload() -> String {
        return payload()
    }

    private func expiredPayload() -> String {
        return payload(timestampOffset: -600)
    }

    private func invalidSignaturePayload() -> String {
        return payload(corruptSignature: true)
    }

    private func payload(timestampOffset: TimeInterval = 0, corruptSignature: Bool = false) -> String {
        let base = try! PaymentData.signed(
            amount: 2500,
            network: "MTN",
            merchantId: "ORG123",
            ttlSeconds: 60,
            timestamp: Date().addingTimeInterval(timestampOffset).timeIntervalSince1970
        )
        let final = corruptSignature
            ? PaymentData(
                amount: base.amount,
                network: base.network,
                merchantId: base.merchantId,
                reference: base.reference,
                timestamp: base.timestamp,
                nonce: base.nonce,
                signature: (base.signature ?? "") + "corrupt",
                ttlSeconds: base.ttlSeconds
            )
            : base
        return NFCTagHandler.formatPaymentData(final) ?? "{}"
    }
}
