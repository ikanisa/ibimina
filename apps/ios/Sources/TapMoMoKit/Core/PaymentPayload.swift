import Foundation

public struct PaymentPayload: Codable, Equatable {
    public let ver: Int
    public let network: Network
    public let merchantId: String
    public let currency: String
    public let amount: Int?
    public let ref: String?
    public let ts: Int64
    public let nonce: String
    public let sig: String?

    public init(
        ver: Int = 1,
        network: Network,
        merchantId: String,
        currency: String,
        amount: Int? = nil,
        ref: String? = nil,
        ts: Int64,
        nonce: String,
        sig: String? = nil
    ) {
        self.ver = ver
        self.network = network
        self.merchantId = merchantId
        self.currency = currency
        self.amount = amount
        self.ref = ref
        self.ts = ts
        self.nonce = nonce
        self.sig = sig
    }
}
