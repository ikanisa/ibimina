import XCTest
@testable import IbiminaClient

final class IbiminaClientTests: XCTestCase {
    func testNFCTagHandlerFormatsAndParsesPayment() throws {
        let payment = PaymentData.sample(amount: 10000, network: "Airtel", merchantId: "ORG123")
        let json = try XCTUnwrap(NFCTagHandler.formatPaymentData(payment))

        XCTAssertTrue(NFCTagHandler.validatePaymentData(json))

        let decoded = NFCTagHandler.parsePaymentData(json)
        XCTAssertEqual(decoded, payment)
        XCTAssertFalse(NFCTagHandler.isPaymentExpired(payment, ttlSeconds: 120))
    }
}
