import Foundation

/// Context required to transform NFC payment data into Supabase allocation requests.
struct PaymentContext: Equatable {
    let orgId: String
    let groupId: String
    let memberId: String
    let sourceNetwork: String
}

/// Shared payment payload used by NFC reader and writer flows.
struct PaymentData: Codable, Equatable {
    let amount: Double
    let network: String
    let merchantId: String
    let reference: String
    let timestamp: Double
    let nonce: String
    let signature: String?
    let ttlSeconds: Int

    enum CodingKeys: String, CodingKey {
        case amount
        case network
        case merchantId = "merchant_id"
        case reference
        case timestamp
        case nonce
        case signature
        case ttlSeconds = "ttl"
    }

    var expiresAt: Double { timestamp + Double(ttlSeconds) }

    /// Converts the NFC payload into an allocation request understood by Supabase.
    func allocationRequest(context: PaymentContext) -> AllocationRequest {
        AllocationRequest(
            orgId: context.orgId,
            groupId: context.groupId,
            memberId: context.memberId,
            amount: amount,
            rawRef: reference,
            source: context.sourceNetwork
        )
    }

    /// Factory helper for demo or preview data.
    static func signed(
        amount: Double = 5000,
        network: String = "MTN",
        merchantId: String = "SACCO123",
        ttlSeconds: Int = 120,
        timestamp: Double = Date().timeIntervalSince1970
    ) throws -> PaymentData {
        let unsigned = PaymentData(
            amount: amount,
            network: network,
            merchantId: merchantId,
            reference: "REF\(Int(Date().timeIntervalSince1970))",
            timestamp: timestamp,
            nonce: UUID().uuidString,
            signature: nil,
            ttlSeconds: ttlSeconds
        )
        let canonical = NFCTagHandler.canonicalString(for: unsigned)
        let signature = try NFCTagHandler.calculateHMAC(data: canonical)
        return PaymentData(
            amount: unsigned.amount,
            network: unsigned.network,
            merchantId: unsigned.merchantId,
            reference: unsigned.reference,
            timestamp: unsigned.timestamp,
            nonce: unsigned.nonce,
            signature: signature,
            ttlSeconds: unsigned.ttlSeconds
        )
    }
}
