import Foundation

public enum Network: String, Codable, CaseIterable, Hashable {
    case mtn = "MTN"
    case airtel = "Airtel"
}

public struct UssdTemplate: Codable, Equatable, Hashable {
    public let shortcut: String
    public let menu: String
    public let base: String

    public init(shortcut: String, menu: String, base: String) {
        self.shortcut = shortcut
        self.menu = menu
        self.base = base
    }
}

public struct TapMoMoConfig: Equatable {
    public var defaultCurrency: String
    public var networks: Set<Network>
    public var requireSignature: Bool
    public var allowUnsignedWithWarning: Bool
    public var useUssdShortcutWhenAmountPresent: Bool
    public var payloadTtlMilliseconds: Int
    public var ussdTemplates: [Network: UssdTemplate]
    public var merchantSecrets: [String: String]

    public init(
        defaultCurrency: String = "RWF",
        networks: Set<Network> = [.mtn, .airtel],
        requireSignature: Bool = true,
        allowUnsignedWithWarning: Bool = true,
        useUssdShortcutWhenAmountPresent: Bool = true,
        payloadTtlMilliseconds: Int = 120_000,
        ussdTemplates: [Network: UssdTemplate] = [
            .mtn: UssdTemplate(
                shortcut: "*182*8*1*{MERCHANT}*{AMOUNT}#",
                menu: "*182*8*1#",
                base: "*182#"
            ),
            .airtel: UssdTemplate(
                shortcut: "*182*8*1*{MERCHANT}*{AMOUNT}#",
                menu: "*182*8*1#",
                base: "*182#"
            )
        ],
        merchantSecrets: [String: String] = [:]
    ) {
        self.defaultCurrency = defaultCurrency
        self.networks = networks
        self.requireSignature = requireSignature
        self.allowUnsignedWithWarning = allowUnsignedWithWarning
        self.useUssdShortcutWhenAmountPresent = useUssdShortcutWhenAmountPresent
        self.payloadTtlMilliseconds = payloadTtlMilliseconds
        self.ussdTemplates = ussdTemplates
        self.merchantSecrets = merchantSecrets
    }
}

public protocol NonceStore: AnyObject {
    func hasSeenNonce(_ nonce: String) -> Bool
    func markNonceSeen(_ nonce: String)
}

public final class InMemoryNonceStore: NonceStore {
    private var storage: Set<String>
    private let queue = DispatchQueue(label: "com.tapmomo.nonce-store", attributes: .concurrent)

    public init(initialNonces: Set<String> = []) {
        self.storage = initialNonces
    }

    public func hasSeenNonce(_ nonce: String) -> Bool {
        queue.sync {
            storage.contains(nonce)
        }
    }

    public func markNonceSeen(_ nonce: String) {
        queue.async(flags: .barrier) {
            self.storage.insert(nonce)
        }
    }
}

public protocol ConfigProviding: AnyObject {
    var currentConfig: TapMoMoConfig { get }
    func merchantSecret(for merchantId: String) -> String?
    var nonceStore: NonceStore { get }
}

public final class TapMoMo: ConfigProviding {
    public static let shared = TapMoMo()

    private var configStorage: TapMoMoConfig
    private var nonceStorage: NonceStore
    private let queue = DispatchQueue(label: "com.tapmomo.config", attributes: .concurrent)

    private init(config: TapMoMoConfig = TapMoMoConfig(), nonceStore: NonceStore = InMemoryNonceStore()) {
        self.configStorage = config
        self.nonceStorage = nonceStore
    }

    public func configure(_ config: TapMoMoConfig) {
        queue.async(flags: .barrier) {
            self.configStorage = config
        }
    }

    public func setNonceStore(_ store: NonceStore) {
        queue.async(flags: .barrier) {
            self.nonceStorage = store
        }
    }

    public var currentConfig: TapMoMoConfig {
        queue.sync {
            configStorage
        }
    }

    public func merchantSecret(for merchantId: String) -> String? {
        queue.sync {
            configStorage.merchantSecrets[merchantId]
        }
    }

    public var nonceStore: NonceStore {
        queue.sync {
            nonceStorage
        }
    }
}
