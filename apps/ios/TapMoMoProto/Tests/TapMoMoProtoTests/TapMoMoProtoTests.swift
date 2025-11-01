import XCTest
@testable import TapMoMoProto

final class TapMoMoProtoTests: XCTestCase {
    private let basePayload = TapMoMoPayload(
        network: "MTN",
        merchantId: "merchant-123",
        currency: "NGN",
        amount: 5000,
        ref: "INV-1",
        ts: 1_700_000_000_000,
        nonce: "abc-123"
    )

    func testSignatureVerificationSucceeds() {
        let secret = "super-secret"
        let signature = signPayload(basePayload, secret: secret)
        let signed = TapMoMoPayload(
            network: basePayload.network,
            merchantId: basePayload.merchantId,
            currency: basePayload.currency,
            amount: basePayload.amount,
            ref: basePayload.ref,
            ts: basePayload.ts,
            nonce: basePayload.nonce,
            sig: signature
        )
        XCTAssertTrue(verifyPayload(signed, secret: secret))
    }

    func testSignatureVerificationFailsWithWrongSecret() {
        let secret = "super-secret"
        let signature = signPayload(basePayload, secret: secret)
        let signed = TapMoMoPayload(
            network: basePayload.network,
            merchantId: basePayload.merchantId,
            currency: basePayload.currency,
            amount: basePayload.amount,
            ref: basePayload.ref,
            ts: basePayload.ts,
            nonce: basePayload.nonce,
            sig: signature
        )
        XCTAssertFalse(verifyPayload(signed, secret: "other-secret"))
    }

    func testTtlExpiryFailsValidation() {
        let now = Date(timeIntervalSince1970: TimeInterval(basePayload.ts + defaultTtlMilliseconds + 1) / 1000)
        XCTAssertFalse(isTimestampWithinTtl(timestamp: basePayload.ts, now: now))
    }

    func testNonceReplayDetection() {
        let store = NonceMemoryStore(ttl: 10_000)
        XCTAssertTrue(store.checkAndStore(nonce: "nonce-1", timestamp: basePayload.ts, now: basePayload.ts))
        XCTAssertFalse(store.checkAndStore(nonce: "nonce-1", timestamp: basePayload.ts + 500, now: basePayload.ts + 500))
    }

    func testDecodeRejectsMissingFields() {
        let json = "{\"ver\":1,\"merchantId\":\"m\",\"currency\":\"NGN\",\"ts\":1,\"nonce\":\"n\"}"
        XCTAssertThrowsError(try decodePayload(json))
    }
}
