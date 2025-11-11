import CoreNFC
import UIKit

/**
 * NFCReaderManager handles NFC tag reading for the Ibimina Client iOS app
 * 
 * Features:
 * - Read NDEF messages from NFC tags
 * - Parse payment information
 * - Timeout handling
 * - Error handling
 * 
 * Use cases:
 * - TapMoMo payment verification
 * - Member card scanning
 */
class NFCReaderManager: NSObject, ObservableObject, NFCNDEFReaderSessionDelegate {
    
    var session: NFCNDEFReaderSession?
    var onTagRead: ((String) -> Void)?
    var onError: ((String) -> Void)?
    
    /**
     * Check if NFC reading is available on this device
     */
    static var isAvailable: Bool {
        return NFCNDEFReaderSession.readingAvailable
    }
    
    /**
     * Begin NFC scanning session
     */
    func beginScanning() {
        guard NFCNDEFReaderSession.readingAvailable else {
            onError?("NFC is not available on this device")
            return
        }
        
        session = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: true
        )
        session?.alertMessage = "Hold your iPhone near the NFC tag"
        session?.begin()
    }
    
    /**
     * Cancel the current scanning session
     */
    func cancelScanning() {
        session?.invalidate()
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    func readerSession(
        _ session: NFCNDEFReaderSession,
        didDetectNDEFs messages: [NFCNDEFMessage]
    ) {
        for message in messages {
            for record in message.records {
                // Parse the payload
                if let payloadString = parsePayload(record.payload) {
                    DispatchQueue.main.async {
                        self.onTagRead?(payloadString)
                    }
                    return
                }
            }
        }
    }
    
    func readerSession(
        _ session: NFCNDEFReaderSession,
        didInvalidateWithError error: Error
    ) {
        // Check if it's a user cancellation
        if let readerError = error as? NFCReaderError {
            if readerError.code == .readerSessionInvalidationErrorUserCanceled {
                return
            }
        }
        
        DispatchQueue.main.async {
            self.onError?("NFC Session error: \(error.localizedDescription)")
        }
    }
    
    func readerSessionDidBecomeActive(_ session: NFCNDEFReaderSession) {
        // Session became active, ready to scan
    }
    
    // MARK: - Helper Methods
    
    /**
     * Parse NDEF record payload to extract text
     */
    private func parsePayload(_ payload: Data) -> String? {
        guard payload.count > 0 else { return nil }
        
        // First byte contains status information
        let statusByte = payload[0]
        let isUTF16 = (statusByte & 0x80) != 0
        let languageCodeLength = Int(statusByte & 0x3F)
        
        // Skip status byte and language code
        let textStart = 1 + languageCodeLength
        guard payload.count > textStart else { return nil }
        
        let textData = payload.subdata(in: textStart..<payload.count)
        
        // Decode based on encoding
        if isUTF16 {
            return String(data: textData, encoding: .utf16)
        } else {
            return String(data: textData, encoding: .utf8)
        }
    }
}
