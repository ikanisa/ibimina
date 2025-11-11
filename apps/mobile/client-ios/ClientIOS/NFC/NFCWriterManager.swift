import Foundation
import CoreNFC

final class NFCWriterManager: NSObject, ObservableObject {
    enum WriterState {
        case idle
        case writing
        case completed
        case failed(error: Error)
    }

    @Published private(set) var state: WriterState = .idle

    private var session: NFCNDEFReaderSession?
    private var pendingMessage: NFCNDEFMessage?

    func beginWriting(message: String) {
        guard NFCNDEFReaderSession.readingAvailable else {
            state = .failed(error: NFCWriterError.writingUnavailable)
            return
        }

        guard let payload = NFCNDEFPayload.wellKnownTypeTextPayload(string: message, locale: .current) else {
            state = .failed(error: NFCWriterError.payloadEncodingFailed)
            return
        }

        pendingMessage = NFCNDEFMessage(records: [payload])
        state = .writing
        session = NFCNDEFReaderSession(delegate: self,
                                       queue: .main,
                                       invalidateAfterFirstRead: false)
        session?.alertMessage = "Hold your iPhone near the NFC tag to write."
        session?.begin()
    }
}

extension NFCWriterManager: NFCNDEFReaderSessionDelegate {
    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        DispatchQueue.main.async {
            self.state = .failed(error: error)
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first, let message = pendingMessage else { return }

        session.connect(to: tag) { [weak self] error in
            if let error {
                DispatchQueue.main.async {
                    self?.state = .failed(error: error)
                }
                return
            }

            tag.queryNDEFStatus { status, _, error in
                if let error {
                    DispatchQueue.main.async {
                        self?.state = .failed(error: error)
                    }
                    return
                }

                guard status == .readWrite else {
                    DispatchQueue.main.async {
                        self?.state = .failed(error: NFCWriterError.tagNotWritable)
                    }
                    return
                }

                tag.writeNDEF(message) { error in
                    DispatchQueue.main.async {
                        if let error {
                            self?.state = .failed(error: error)
                        } else {
                            self?.state = .completed
                            session.invalidate()
                        }
                    }
                }
            }
        }
    }
}

enum NFCWriterError: LocalizedError {
    case writingUnavailable
    case payloadEncodingFailed
    case tagNotWritable

    var errorDescription: String? {
        switch self {
        case .writingUnavailable:
            return "NFC writing is not supported on this device."
        case .payloadEncodingFailed:
            return "Unable to encode message for NFC tag."
        case .tagNotWritable:
            return "The detected NFC tag is not writable."
        }
    }
}
