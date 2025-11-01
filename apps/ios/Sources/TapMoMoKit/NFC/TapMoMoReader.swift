import Foundation

public enum TapMoMoReaderOutcome: Equatable {
    case valid(PaymentPayload)
    case unsignedWarning(PaymentPayload, message: String)
}

public enum TapMoMoReaderError: Error, Equatable {
    case nfcUnavailable
    case sessionAlreadyInProgress
    case unsupportedTag
    case selectCommandFailed(String)
    case invalidStatusWord(sw1: UInt8, sw2: UInt8)
    case invalidPayload
    case validationFailed(String)
    case sessionInvalidated(String?)
}

public final class TapMoMoReader: NSObject {
    private static let tapMoMoAid = Data([0xF0, 0x12, 0x34, 0x56, 0x78, 0x90])

    private let validator: PayloadValidating
    private let sessionProvider: TagReaderSessionProvider
    private let jsonDecoder: JSONDecoder
    private var completion: ((Result<TapMoMoReaderOutcome, TapMoMoReaderError>) -> Void)?
    private var finished = false
    private let completionQueue: DispatchQueue

    public init(
        validator: PayloadValidating = PayloadValidator(),
        sessionProvider: TagReaderSessionProvider? = nil,
        decoder: JSONDecoder = JSONDecoder(),
        completionQueue: DispatchQueue = .main
    ) {
        self.validator = validator
        self.sessionProvider = sessionProvider ?? TapMoMoReader.makeDefaultSessionProvider()
        self.jsonDecoder = decoder
        self.completionQueue = completionQueue
        super.init()
    }

    public func startReading(
        completion: @escaping (Result<TapMoMoReaderOutcome, TapMoMoReaderError>) -> Void
    ) {
        guard sessionProvider.isAvailable else {
            completion(.failure(.nfcUnavailable))
            return
        }

        guard self.completion == nil else {
            completion(.failure(.sessionAlreadyInProgress))
            return
        }

        finished = false
        self.completion = completion
        sessionProvider.setAlertMessage("Hold your phone near the merchant's device.")
        sessionProvider.beginSession(delegate: self)
    }

    private func handle(tag: ISO7816TagCommunicating) {
        tag.selectAid(Self.tapMoMoAid) { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .failure(let error):
                self.finish(.failure(.selectCommandFailed(error.localizedDescription)))
            case .success(let response):
                self.handle(response: response)
            }
        }
    }

    private func handle(response: ISO7816Response) {
        guard response.sw1 == 0x90, response.sw2 == 0x00 else {
            finish(.failure(.invalidStatusWord(sw1: response.sw1, sw2: response.sw2)))
            return
        }

        guard let payload = parsePayload(from: response.data) else {
            finish(.failure(.invalidPayload))
            return
        }

        let validation = validator.validate(payload: payload)
        switch validation {
        case .valid:
            sessionProvider.setAlertMessage("Payment request received.")
            finish(.success(.valid(payload)))
        case .unsignedWarning(let message):
            sessionProvider.setAlertMessage("Payment request needs review.")
            finish(.success(.unsignedWarning(payload, message: message)))
        case .invalid(let reason):
            finish(.failure(.validationFailed(reason)))
        }
    }

    private func parsePayload(from data: Data) -> PaymentPayload? {
        guard !data.isEmpty else { return nil }
        return try? jsonDecoder.decode(PaymentPayload.self, from: data)
    }

    private func finish(_ result: Result<TapMoMoReaderOutcome, TapMoMoReaderError>) {
        guard !finished else { return }
        finished = true
        let completion = self.completion
        self.completion = nil

        completionQueue.async {
            completion?(result)
        }

        switch result {
        case .success:
            sessionProvider.invalidateSession(errorMessage: nil)
        case .failure(let error):
            var message: String?
            if case let .validationFailed(reason) = error {
                message = reason
            } else if case let .sessionInvalidated(reason) = error {
                message = reason
            }
            sessionProvider.invalidateSession(errorMessage: message)
        }
    }

    private static func makeDefaultSessionProvider() -> TagReaderSessionProvider {
        #if canImport(CoreNFC)
        return CoreNFCTagReaderSessionProvider()
        #else
        return UnavailableTagReaderSessionProvider()
        #endif
    }
}

extension TapMoMoReader: TagReaderSessionDelegate {
    public func tagReaderSessionDidBecomeActive(_ provider: TagReaderSessionProvider) {}

    public func tagReaderSession(_ provider: TagReaderSessionProvider, didDetect tag: ISO7816TagCommunicating) {
        handle(tag: tag)
    }

    public func tagReaderSession(_ provider: TagReaderSessionProvider, didInvalidateWith error: Error?) {
        guard !finished else { return }
        if let error {
            finish(.failure(.sessionInvalidated(error.localizedDescription)))
        } else {
            finish(.failure(.sessionInvalidated(nil)))
        }
    }

    public func tagReaderSessionDetectedUnsupportedTag(_ provider: TagReaderSessionProvider) {
        finish(.failure(.unsupportedTag))
    }
}
