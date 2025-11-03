import Foundation

public struct UssdLocaleDefinition: Codable {
    public let copy: String
    public let cta: String
    public let instructions: [String]
}

public struct UssdTemplateSet: Codable {
    public let shortcut: String
    public let menu: String
    public let base: String
}

public struct UssdPlaceholders: Codable {
    public let merchant: String
    public let amount: String
    public let reference: String
}

public struct UssdOperatorConfig: Codable {
    public let id: String
    public let name: String
    public let network: String
    public let country: String
    public let currency: String
    public let supportsAutoDial: Bool
    public let `default`: Bool
    public let shortcode: String
    public let templates: UssdTemplateSet
    public let placeholders: UssdPlaceholders
    public let locales: [String: UssdLocaleDefinition]
}

public struct UssdConfig: Codable {
    public let version: String
    public let ttlSeconds: Int
    public let operators: [UssdOperatorConfig]
}

public struct UssdCopyPayload {
    public let code: String
    public let copyText: String
    public let instructions: [String]
    public let formattedAmount: String?
    public let version: String
    public let ttlSeconds: Int
    public let expiresAt: Date
    public let localeIdentifier: String
    public let operatorId: String
}

public struct UssdBuildRequest {
    public init(
        merchantCode: String,
        amount: Decimal? = nil,
        reference: String? = nil,
        operatorConfig: UssdOperatorConfig? = nil,
        operatorId: String? = nil,
        localeIdentifier: String? = nil,
        versionOverride: String? = nil,
        ttlSecondsOverride: Int? = nil
    ) {
        self.merchantCode = merchantCode
        self.amount = amount
        self.reference = reference
        self.operatorConfig = operatorConfig
        self.operatorId = operatorId
        self.localeIdentifier = localeIdentifier
        self.versionOverride = versionOverride
        self.ttlSecondsOverride = ttlSecondsOverride
    }

    public let merchantCode: String
    public let amount: Decimal?
    public let reference: String?
    public let operatorConfig: UssdOperatorConfig?
    public let operatorId: String?
    public let localeIdentifier: String?
    public let versionOverride: String?
    public let ttlSecondsOverride: Int?
}

public enum UssdBuilder {
    public static func buildCopyPayload(
        config: UssdConfig,
        request: UssdBuildRequest,
        clock: () -> Date = Date.init
    ) -> UssdCopyPayload {
        let operatorConfig = resolveOperator(config: config, request: request)
        let localeData = resolveLocale(operatorConfig: operatorConfig, localeIdentifier: request.localeIdentifier)
        let code = buildCode(operatorConfig: operatorConfig, merchantCode: request.merchantCode, amount: request.amount)
        let formattedAmount = formatAmount(amount: request.amount, currencyCode: operatorConfig.currency, localeIdentifier: localeData.identifier)

        let replacements: [String: String] = [
            "code": code,
            "amount": formattedAmount ?? "",
            "reference": request.reference ?? ""
        ]

        let copyText = interpolate(template: localeData.definition.copy, replacements: replacements)
        let instructions = localeData.definition.instructions.map { interpolate(template: $0, replacements: replacements) }

        let ttlSeconds = request.ttlSecondsOverride ?? config.ttlSeconds
        let version = request.versionOverride ?? config.version
        let expiresAt = clock().addingTimeInterval(TimeInterval(ttlSeconds))

        return UssdCopyPayload(
            code: code,
            copyText: copyText,
            instructions: instructions,
            formattedAmount: formattedAmount,
            version: version,
            ttlSeconds: ttlSeconds,
            expiresAt: expiresAt,
            localeIdentifier: localeData.identifier,
            operatorId: operatorConfig.id
        )
    }

    private static func resolveOperator(config: UssdConfig, request: UssdBuildRequest) -> UssdOperatorConfig {
        if let operatorConfig = request.operatorConfig {
            return operatorConfig
        }

        if let operatorId = request.operatorId,
           let match = config.operators.first(where: { $0.id.caseInsensitiveCompare(operatorId) == .orderedSame }) {
            return match
        }

        return config.operators.first(where: { $0.default }) ?? config.operators[0]
    }

    private static func resolveLocale(operatorConfig: UssdOperatorConfig, localeIdentifier: String?) -> (identifier: String, definition: UssdLocaleDefinition) {
        if let localeIdentifier = localeIdentifier {
            if let match = operatorConfig.locales.first(where: { $0.key.caseInsensitiveCompare(localeIdentifier) == .orderedSame }) {
                return (match.key, match.value)
            }
        }

        if let first = operatorConfig.locales.first {
            return (first.key, first.value)
        }

        fatalError("USSD operator is missing locale definitions")
    }

    private static func buildCode(operatorConfig: UssdOperatorConfig, merchantCode: String, amount: Decimal?) -> String {
        let template = amount != nil ? operatorConfig.templates.shortcut : operatorConfig.templates.menu
        var code = template.replacingOccurrences(of: operatorConfig.placeholders.merchant, with: merchantCode)

        if let amount = amount {
            code = code.replacingOccurrences(of: operatorConfig.placeholders.amount, with: NSDecimalNumber(decimal: amount).stringValue)
        }

        return code
    }

    private static func formatAmount(amount: Decimal?, currencyCode: String, localeIdentifier: String) -> String? {
        guard let amount = amount else { return nil }
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: localeIdentifier.replacingOccurrences(of: "-", with: "_"))
        formatter.numberStyle = .currency
        formatter.currencyCode = currencyCode
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSDecimalNumber(decimal: amount))
    }

    private static func interpolate(template: String, replacements: [String: String]) -> String {
        var result = template
        for (key, value) in replacements {
            result = result.replacingOccurrences(of: "{\(key)}", with: value)
        }
        return result
    }
}
