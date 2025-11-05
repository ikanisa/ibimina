#if canImport(CoreNFC)
import CoreNFC

public final class CoreNFCTagReaderSessionProvider: NSObject, TagReaderSessionProvider {
    private var session: NFCTagReaderSession?
    private weak var delegate: TagReaderSessionDelegate?
    private var pendingAlertMessage: String = "Hold your phone near the merchant's device."

    public override init() {
        super.init()
    }

    public var isAvailable: Bool {
        NFCTagReaderSession.readingAvailable
    }

    public func setAlertMessage(_ message: String) {
        if let session {
            session.alertMessage = message
        } else {
            pendingAlertMessage = message
        }
    }

    public func beginSession(delegate: TagReaderSessionDelegate) {
        self.delegate = delegate
        let session = NFCTagReaderSession(pollingOption: [.iso14443], delegate: self, queue: nil)
        session.alertMessage = pendingAlertMessage
        session.begin()
        self.session = session
    }

    public func invalidateSession(errorMessage: String?) {
        guard let session else { return }
        if let message = errorMessage, !message.isEmpty {
            session.invalidate(errorMessage: message)
        } else {
            session.invalidate()
        }
        self.session = nil
    }
}

extension CoreNFCTagReaderSessionProvider: NFCTagReaderSessionDelegate {
    public func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
        delegate?.tagReaderSessionDidBecomeActive(self)
    }

    public func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
        delegate?.tagReaderSession(self, didInvalidateWith: error)
        self.session = nil
    }

    public func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        guard let tag = tags.first else { return }
        session.connect(to: tag) { [weak self] error in
            guard let self else { return }
            if let error {
                self.delegate?.tagReaderSession(self, didInvalidateWith: error)
                return
            }

            switch tag {
            case .iso7816(let iso7816):
                self.delegate?.tagReaderSession(self, didDetect: iso7816)
            default:
                self.delegate?.tagReaderSessionDetectedUnsupportedTag(self)
            }
        }
    }
}

private enum TapMoMoReaderBridgeError: Error {
    case invalidApdu
}

extension NFCISO7816Tag: ISO7816TagCommunicating {
    public func selectAid(_ aid: Data, completion: @escaping (Result<ISO7816Response, Error>) -> Void) {
        guard let apdu = NFCISO7816APDU(
            instructionClass: 0x00,
            instructionCode: 0xA4,
            p1Parameter: 0x04,
            p2Parameter: 0x00,
            data: aid,
            expectedResponseLength: 0
        ) else {
            completion(.failure(TapMoMoReaderBridgeError.invalidApdu))
            return
        }

        sendCommand(apdu: apdu) { data, sw1, sw2, error in
            if let error {
                completion(.failure(error))
                return
            }

            let response = ISO7816Response(data: data ?? Data(), sw1: sw1, sw2: sw2)
            completion(.success(response))
        }
    }
}
#endif
