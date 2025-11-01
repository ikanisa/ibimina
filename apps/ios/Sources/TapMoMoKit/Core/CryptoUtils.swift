import Foundation
#if canImport(CryptoKit)
import CryptoKit
#else
import Crypto
#endif

public enum CryptoUtils {
    public static func hmacSha256(message: String, secret: String) -> String {
        let key = SymmetricKey(data: Data(secret.utf8))
        let signature = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: key)
        return Data(signature).base64EncodedString()
    }

    public static func verifyHmacSha256(message: String, signature: String, secret: String) -> Bool {
        let expected = hmacSha256(message: message, secret: secret)
        return constantTimeEquals(expected, signature)
    }

    private static func constantTimeEquals(_ lhs: String, _ rhs: String) -> Bool {
        let lhsData = Data(lhs.utf8)
        let rhsData = Data(rhs.utf8)
        guard lhsData.count == rhsData.count else { return false }

        var difference: UInt8 = 0
        for i in 0..<lhsData.count {
            difference |= lhsData[i] ^ rhsData[i]
        }
        return difference == 0
    }

    public static func createSignableMessage(
        ver: Int,
        network: String,
        merchantId: String,
        currency: String,
        amount: Int?,
        ref: String?,
        ts: Int64,
        nonce: String
    ) -> String {
        var components: [String] = []
        components.append("ver=\(ver)")
        components.append("network=\(network)")
        components.append("merchantId=\(merchantId)")
        components.append("currency=\(currency)")
        if let amount { components.append("amount=\(amount)") }
        if let ref { components.append("ref=\(ref)") }
        components.append("ts=\(ts)")
        components.append("nonce=\(nonce)")
        return components.joined(separator: "&")
    }
}
