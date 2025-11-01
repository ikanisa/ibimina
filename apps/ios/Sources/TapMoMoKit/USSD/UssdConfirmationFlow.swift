import Foundation

public protocol PasteboardWriting {
    func setString(_ value: String?)
}

public protocol UssdDialerOpening {
    func canOpen(_ url: URL) -> Bool
    func open(_ url: URL, completion: @escaping (Bool) -> Void)
}

#if canImport(UIKit)
import UIKit

public final class SystemPasteboard: PasteboardWriting {
    private let pasteboard: UIPasteboard

    public init(pasteboard: UIPasteboard = .general) {
        self.pasteboard = pasteboard
    }

    public func setString(_ value: String?) {
        pasteboard.string = value
    }
}

public final class SystemDialerOpener: UssdDialerOpening {
    private let application: UIApplication

    public init(application: UIApplication = .shared) {
        self.application = application
    }

    public func canOpen(_ url: URL) -> Bool {
        application.canOpenURL(url)
    }

    public func open(_ url: URL, completion: @escaping (Bool) -> Void) {
        application.open(url, options: [:], completionHandler: completion)
    }
}
#else
public final class SystemPasteboard: PasteboardWriting {
    public init() {}
    public func setString(_ value: String?) {}
}

public final class SystemDialerOpener: UssdDialerOpening {
    public init() {}
    public func canOpen(_ url: URL) -> Bool { false }
    public func open(_ url: URL, completion: @escaping (Bool) -> Void) { completion(false) }
}
#endif

public struct UssdConfirmationResult: Equatable {
    public let ussdCode: String
    public let instructions: String
}

public enum UssdConfirmationError: Error, Equatable {
    case unsupportedNetwork
    case cannotOpenDialer
}

public final class UssdConfirmationFlow {
    private let pasteboard: PasteboardWriting
    private let dialer: UssdDialerOpening
    private let configProvider: ConfigProviding
    private let completionQueue: DispatchQueue
    private let telURL = URL(string: "tel://")!

    public init(
        pasteboard: PasteboardWriting = SystemPasteboard(),
        dialer: UssdDialerOpening = SystemDialerOpener(),
        configProvider: ConfigProviding = TapMoMo.shared,
        completionQueue: DispatchQueue = .main
    ) {
        self.pasteboard = pasteboard
        self.dialer = dialer
        self.configProvider = configProvider
        self.completionQueue = completionQueue
    }

    public func start(
        network: Network,
        merchantId: String,
        amount: Int?,
        completion: @escaping (Result<UssdConfirmationResult, UssdConfirmationError>) -> Void
    ) {
        let config = configProvider.currentConfig
        guard let template = config.ussdTemplates[network] else {
            completionQueue.async {
                completion(.failure(.unsupportedNetwork))
            }
            return
        }

        let ussdCode = buildUssdCode(
            template: template,
            merchantId: merchantId,
            amount: amount,
            useShortcut: config.useUssdShortcutWhenAmountPresent
        )

        pasteboard.setString(ussdCode)

        guard dialer.canOpen(telURL) else {
            completionQueue.async {
                completion(.failure(.cannotOpenDialer))
            }
            return
        }

        let instructions = "Paste the copied USSD code \(ussdCode) into the dialer to confirm your payment."
        dialer.open(telURL) { success in
            self.completionQueue.async {
                if success {
                    completion(.success(UssdConfirmationResult(ussdCode: ussdCode, instructions: instructions)))
                } else {
                    completion(.failure(.cannotOpenDialer))
                }
            }
        }
    }

    private func buildUssdCode(
        template: UssdTemplate,
        merchantId: String,
        amount: Int?,
        useShortcut: Bool
    ) -> String {
        if let amount, useShortcut {
            return template.shortcut
                .replacingOccurrences(of: "{MERCHANT}", with: merchantId)
                .replacingOccurrences(of: "{AMOUNT}", with: String(amount))
        }

        return template.menu.replacingOccurrences(of: "{MERCHANT}", with: merchantId)
    }
}
