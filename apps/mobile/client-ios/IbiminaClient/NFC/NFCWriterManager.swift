import CoreNFC
import UIKit

/**
 * NFCWriterManager handles NFC tag writing for the Ibimina Client iOS app
 * 
 * Features:
 * - Write NDEF messages to NFC tags
 * - Format tags if needed
 * - Check tag writability
 * - Handle write errors
 * 
 * Use cases:
 * - TapMoMo payment handoff (merchant side)
 * - Creating payment shortcuts
 */
class NFCWriterManager: NSObject, ObservableObject, NFCNDEFReaderSessionDelegate {
    
    var session: NFCNDEFReaderSession?
    var dataToWrite: String = ""
    var onWriteSuccess: (() -> Void)?
    var onWriteError: ((String) -> Void)?
    
    /**
     * Check if NFC writing is available
     */
    static var isAvailable: Bool {
        return NFCNDEFReaderSession.readingAvailable
    }
    
    /**
     * Begin writing data to NFC tag
     */
    func beginWriting(data: String) {
        guard NFCNDEFReaderSession.readingAvailable else {
            onWriteError?("NFC is not available on this device")
            return
        }
        
        self.dataToWrite = data
        session = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: false
        )
        session?.alertMessage = "Hold your iPhone near the NFC tag to write"
        session?.begin()
    }
    
    /**
     * Cancel the current writing session
     */
    func cancelWriting() {
        session?.invalidate()
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    func readerSession(
        _ session: NFCNDEFReaderSession,
        didDetectNDEFs messages: [NFCNDEFMessage]
    ) {
        // Not used in write mode
    }
    
    func readerSession(
        _ session: NFCNDEFReaderSession,
        didDetect tags: [NFCNDEFTag]
    ) {
        guard tags.count == 1 else {
            session.invalidate(errorMessage: "Multiple tags detected. Please present only one tag.")
            DispatchQueue.main.async {
                self.onWriteError?("Multiple tags detected")
            }
            return
        }
        
        let tag = tags.first!
        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed. Please try again.")
                DispatchQueue.main.async {
                    self.onWriteError?("Connection failed: \(error.localizedDescription)")
                }
                return
            }
            
            // Query tag status
            tag.queryNDEFStatus { status, capacity, error in
                guard error == nil else {
                    session.invalidate(errorMessage: "Query failed. Please try again.")
                    DispatchQueue.main.async {
                        self.onWriteError?("Query failed")
                    }
                    return
                }
                
                switch status {
                case .readWrite:
                    self.writeToTag(tag: tag, session: session)
                    
                case .readOnly:
                    session.invalidate(errorMessage: "Tag is read-only and cannot be written to.")
                    DispatchQueue.main.async {
                        self.onWriteError?("Tag is read-only")
                    }
                    
                case .notSupported:
                    session.invalidate(errorMessage: "Tag is not supported.")
                    DispatchQueue.main.async {
                        self.onWriteError?("Tag is not supported")
                    }
                    
                @unknown default:
                    session.invalidate(errorMessage: "Unknown tag status.")
                    DispatchQueue.main.async {
                        self.onWriteError?("Unknown tag status")
                    }
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
            self.onWriteError?("Session error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Helper Methods
    
    /**
     * Write NDEF message to the tag
     */
    private func writeToTag(tag: NFCNDEFTag, session: NFCNDEFReaderSession) {
        // Create NDEF payload
        guard let payload = createNDEFPayload(text: dataToWrite) else {
            session.invalidate(errorMessage: "Failed to create payload.")
            DispatchQueue.main.async {
                self.onWriteError?("Failed to create payload")
            }
            return
        }
        
        let message = NFCNDEFMessage(records: [payload])
        
        // Write to tag
        tag.writeNDEF(message) { error in
            if let error = error {
                session.invalidate(errorMessage: "Write failed. Please try again.")
                DispatchQueue.main.async {
                    self.onWriteError?("Write failed: \(error.localizedDescription)")
                }
            } else {
                session.alertMessage = "Write successful!"
                session.invalidate()
                DispatchQueue.main.async {
                    self.onWriteSuccess?()
                }
            }
        }
    }
    
    /**
     * Create NDEF text record payload
     */
    private func createNDEFPayload(text: String) -> NFCNDEFPayload? {
        guard let textData = text.data(using: .utf8) else {
            return nil
        }
        
        // Create payload with language code "en"
        let languageCode = "en"
        guard let languageData = languageCode.data(using: .utf8) else {
            return nil
        }
        
        // Status byte: UTF-8 encoding, language code length
        let statusByte: UInt8 = UInt8(languageData.count)
        var payloadData = Data([statusByte])
        payloadData.append(languageData)
        payloadData.append(textData)
        
        return NFCNDEFPayload(
            format: .nfcWellKnown,
            type: Data([0x54]), // "T" for text record
            identifier: Data(),
            payload: payloadData
        )
    }
}
