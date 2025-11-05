import Foundation

public enum PayloadValidationResult: Equatable {
    case valid
    case unsignedWarning(String)
    case invalid(String)
}

public protocol PayloadValidating {
    func validate(payload: PaymentPayload) -> PayloadValidationResult
}

public final class PayloadValidator: PayloadValidating {
    private let configProvider: ConfigProviding
    private let timeProvider: TimeProviding
    private let nonceStore: NonceStore

    public init(
        configProvider: ConfigProviding = TapMoMo.shared,
        timeProvider: TimeProviding = SystemTimeProvider(),
        nonceStore: NonceStore? = nil
    ) {
        self.configProvider = configProvider
        self.timeProvider = timeProvider
        self.nonceStore = nonceStore ?? configProvider.nonceStore
    }

    public func validate(payload: PaymentPayload) -> PayloadValidationResult {
        let config = configProvider.currentConfig
        let now = timeProvider.now()

        guard TimeUtils.validatePayloadTtl(
            timestamp: payload.ts,
            allowedDelayMilliseconds: config.payloadTtlMilliseconds,
            now: now
        ) else {
            return .invalid("Payment request has expired")
        }

        guard !nonceStore.hasSeenNonce(payload.nonce) else {
            return .invalid("Duplicate payment request detected")
        }

        if config.requireSignature {
            guard let signature = payload.sig, !signature.isEmpty else {
                if config.allowUnsignedWithWarning {
                    return .unsignedWarning("Payment signature missing")
                } else {
                    return .invalid("Payment signature is required")
                }
            }

            if let merchantSecret = configProvider.merchantSecret(for: payload.merchantId) {
                let message = CryptoUtils.createSignableMessage(
                    ver: payload.ver,
                    network: payload.network.rawValue,
                    merchantId: payload.merchantId,
                    currency: payload.currency,
                    amount: payload.amount,
                    ref: payload.ref,
                    ts: payload.ts,
                    nonce: payload.nonce
                )

                guard CryptoUtils.verifyHmacSha256(
                    message: message,
                    signature: signature,
                    secret: merchantSecret
                ) else {
                    return .invalid("Invalid payment signature")
                }
            }
        }

        nonceStore.markNonceSeen(payload.nonce)
        return .valid
    }
}
