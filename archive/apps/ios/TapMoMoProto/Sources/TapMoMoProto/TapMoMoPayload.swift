import CryptoKit
import Foundation

public let tapMoMoPayloadSchemaJSON = """
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.ibimina.com/tapmomo/payload.json",
  "title": "TapMoMoPayload",
  "type": "object",
  "required": ["ver", "network", "merchantId", "currency", "ts", "nonce"],
  "properties": {
    "ver": { "type": "integer", "enum": [1] },
    "network": { "type": "string", "minLength": 1 },
    "merchantId": { "type": "string", "minLength": 1 },
    "currency": { "type": "string", "minLength": 1 },
    "amount": { "type": "integer", "minimum": 0 },
    "ref": { "type": "string", "minLength": 1 },
    "ts": { "type": "integer", "minimum": 0 },
    "nonce": { "type": "string", "minLength": 1 },
    "sig": { "type": "string", "minLength": 44 }
  },
  "additionalProperties": false
}
"""

public struct TapMoMoPayload: Codable, Equatable {
    public let ver: Int
    public let network: String
    public let merchantId: String
    public let currency: String
    public let amount: Int?
    public let ref: String?
    public let ts: Int64
    public let nonce: String
    public let sig: String?

    public init(
        ver: Int = 1,
        network: String,
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

public enum TapMoMoProtoError: Error {
    case missingRequiredField(String)
    case unsupportedVersion
    case invalidSignature
}

public func createSignableMessage(from payload: TapMoMoPayload) -> String {
    var segments: [String] = [
        "ver=\(payload.ver)",
        "network=\(payload.network)",
        "merchantId=\(payload.merchantId)",
        "currency=\(payload.currency)"
    ]
    if let amount = payload.amount {
        segments.append("amount=\(amount)")
    }
    if let ref = payload.ref {
        segments.append("ref=\(ref)")
    }
    segments.append("ts=\(payload.ts)")
    segments.append("nonce=\(payload.nonce)")
    return segments.joined(separator: "&")
}

public func signPayload(_ payload: TapMoMoPayload, secret: String) -> String {
    let message = createSignableMessage(from: payload)
    return signMessage(message, secret: secret)
}

public func signMessage(_ message: String, secret: String) -> String {
    let key = SymmetricKey(data: Data(secret.utf8))
    let signature = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: key)
    return Data(signature).base64EncodedString()
}

public func verifyPayload(_ payload: TapMoMoPayload, secret: String) -> Bool {
    guard let sig = payload.sig, let signatureData = Data(base64Encoded: sig) else {
        return false
    }
    let message = createSignableMessage(from: payload)
    let key = SymmetricKey(data: Data(secret.utf8))
    let expected = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: key)
    return constantTimeEquals(Data(expected), signatureData)
}

private func constantTimeEquals(_ lhs: Data, _ rhs: Data) -> Bool {
    guard lhs.count == rhs.count else { return false }
    var difference: UInt8 = 0
    for idx in lhs.indices {
        difference |= lhs[idx] ^ rhs[idx]
    }
    return difference == 0
}

public func encodePayload(_ payload: TapMoMoPayload) throws -> String {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    let data = try encoder.encode(payload)
    guard let json = String(data: data, encoding: .utf8) else {
        throw TapMoMoProtoError.invalidSignature
    }
    return json
}

public func decodePayload(_ raw: String) throws -> TapMoMoPayload {
    guard let data = raw.data(using: .utf8) else {
        throw TapMoMoProtoError.invalidSignature
    }
    let payload = try JSONDecoder().decode(TapMoMoPayload.self, from: data)
    let requiredFields: [(String, Bool)] = [
        ("network", !payload.network.isEmpty),
        ("merchantId", !payload.merchantId.isEmpty),
        ("currency", !payload.currency.isEmpty),
        ("nonce", !payload.nonce.isEmpty)
    ]
    for field in requiredFields where !field.1 {
        throw TapMoMoProtoError.missingRequiredField(field.0)
    }
    guard payload.ver == 1 else {
        throw TapMoMoProtoError.unsupportedVersion
    }
    return payload
}

public let defaultTtlMilliseconds: Int64 = 120_000

public func isTimestampWithinTtl(
    timestamp: Int64,
    ttl: Int64 = defaultTtlMilliseconds,
    now: Date = Date()
) -> Bool {
    let age = Int64(now.timeIntervalSince1970 * 1000) - timestamp
    return age >= 0 && age <= ttl
}

public final class NonceMemoryStore {
    private let ttl: Int64
    private var entries: [String: Int64] = [:]

    public init(ttl: Int64 = defaultTtlMilliseconds) {
        self.ttl = ttl
    }

    private func purge(now: Int64) {
        entries = entries.filter { now - $0.value <= ttl }
    }

    @discardableResult
    public func checkAndStore(nonce: String, timestamp: Int64, now: Int64 = Int64(Date().timeIntervalSince1970 * 1000)) -> Bool {
        purge(now: now)
        if let seenAt = entries[nonce], now - seenAt <= ttl {
            return false
        }
        entries[nonce] = timestamp
        return true
    }
}
