import Foundation
import CoreNFC
import Combine

final class NFCReaderManager: NSObject, ObservableObject {
    enum ReaderState {
        case idle
        case scanning
        case completed(message: String)
        case failed(error: Error)
    }

    @Published private(set) var state: ReaderState = .idle

    private var session: NFCNDEFReaderSession?

    func beginScanning() {
        guard NFCNDEFReaderSession.readingAvailable else {
            state = .failed(error: NFCReaderError.readingUnavailable)
            return
        }

        state = .scanning
        session = NFCNDEFReaderSession(delegate: self,
                                       queue: .main,
                                       invalidateAfterFirstRead: true)
        session?.alertMessage = "Hold your iPhone near the NFC tag."
        session?.begin()
    }
}

extension NFCReaderManager: NFCNDEFReaderSessionDelegate {
    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        DispatchQueue.main.async {
            self.state = .failed(error: error)
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        let payload = messages
            .flatMap { $0.records }
            .compactMap { String(data: $0.payload, encoding: .utf8) }
            .joined(separator: "\n")
        DispatchQueue.main.async {
            self.state = .completed(message: payload)
        }
    }
}

enum NFCReaderError: LocalizedError {
    case readingUnavailable

    var errorDescription: String? {
        switch self {
        case .readingUnavailable:
            return "NFC reading is not supported on this device."
        }
    }
}
