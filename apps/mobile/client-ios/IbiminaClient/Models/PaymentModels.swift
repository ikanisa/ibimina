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

    enum CodingKeys: String, CodingKey {
        case amount
        case network
        case merchantId = "merchant_id"
        case reference
        case timestamp
        case nonce
        case signature
    }

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
    static func sample(
        amount: Double = 5000,
        network: String = "MTN",
        merchantId: String = "SACCO123"
    ) -> PaymentData {
        PaymentData(
            amount: amount,
            network: network,
            merchantId: merchantId,
            reference: "REF\(Int(Date().timeIntervalSince1970))",
            timestamp: Date().timeIntervalSince1970,
            nonce: UUID().uuidString,
            signature: nil
        )
    }
}
