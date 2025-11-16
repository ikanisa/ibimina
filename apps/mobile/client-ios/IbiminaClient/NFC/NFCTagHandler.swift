import CoreNFC
import CryptoKit
import Foundation
import Security

/**
 * NFCTagHandler provides utility functions for working with NFC tags
 * 
 * Features:
 * - Tag validation
 * - Data parsing
 * - Format detection
 */
class NFCTagHandler {

    enum NFCSecretStore {
        private static let service = "com.ibimina.tapmomo"
        private static let account = "nfc-hmac-secret"

        enum SecretError: Error {
            case missingSecret
            case unhandled(OSStatus)
        }

        static func ensureDefaultSecret() {
            if (try? fetchSecretData()) != nil { return }
            guard
                let encoded = Bundle.main.object(forInfoDictionaryKey: "NFC_HMAC_SECRET") as? String,
                let data = Data(base64Encoded: encoded)
            else { return }
            try? storeSecret(data)
        }

        static func secretKey() throws -> SymmetricKey {
            guard let data = try fetchSecretData() else {
                throw SecretError.missingSecret
            }
            return SymmetricKey(data: data)
        }

        private static func storeSecret(_ data: Data) throws {
            let query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: account,
                kSecValueData as String: data
            ]
            let status = SecItemAdd(query as CFDictionary, nil)
            if status == errSecDuplicateItem {
                let updateStatus = SecItemUpdate(
                    [kSecClass as String: kSecClassGenericPassword,
                     kSecAttrService as String: service,
                     kSecAttrAccount as String: account] as CFDictionary,
                    [kSecValueData as String: data] as CFDictionary
                )
                guard updateStatus == errSecSuccess else { throw SecretError.unhandled(updateStatus) }
            } else if status != errSecSuccess {
                throw SecretError.unhandled(status)
            }
        }

        private static func fetchSecretData() throws -> Data? {
            let query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: account,
                kSecReturnData as String: kCFBooleanTrue as Any,
                kSecMatchLimit as String: kSecMatchLimitOne
            ]
            var item: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &item)
            if status == errSecItemNotFound { return nil }
            guard status == errSecSuccess else { throw SecretError.unhandled(status) }
            return item as? Data
        }
    }
    
    /**
     * Validate payment data format
     */
    static func validatePaymentData(_ data: String) -> Bool {
        // Check if data is valid JSON format
        guard let jsonData = data.data(using: .utf8) else {
            return false
        }
        
        do {
            if let json = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                // Validate required fields
                let requiredFields = ["amount", "network", "merchant_id", "reference", "signature", "ttl"]
                for field in requiredFields {
                    if json[field] == nil {
                        return false
                    }
                }
                return true
            }
        } catch {
            return false
        }
        
        return false
    }
    
    /**
     * Parse payment data from NFC tag
     */
    static func parsePaymentData(_ data: String) -> PaymentData? {
        guard let jsonData = data.data(using: .utf8) else {
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(PaymentData.self, from: jsonData)
        } catch {
            print("Error parsing payment data: \(error)")
            return nil
        }
    }
    
    /**
     * Format payment data for writing to NFC tag
     */
    static func formatPaymentData(_ payment: PaymentData) -> String? {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let jsonData = try encoder.encode(payment)
            return String(data: jsonData, encoding: .utf8)
        } catch {
            print("Error formatting payment data: \(error)")
            return nil
        }
    }
    
    /**
     * Calculate HMAC signature for payment data
     */
    static func calculateHMAC(data: String) throws -> String {
        NFCSecretStore.ensureDefaultSecret()
        let key = try NFCSecretStore.secretKey()
        let mac = HMAC<SHA256>.authenticationCode(for: Data(data.utf8), using: key)
        return Data(mac).base64EncodedString()
    }

    /**
     * Verify HMAC signature
     */
    static func verifyHMAC(data: String, signature: String) -> Bool {
        guard let expected = try? calculateHMAC(data: data) else { return false }
        return expected == signature
    }
    
    /**
     * Check if payment data is expired (TTL)
     */
    static func isPaymentExpired(_ payment: PaymentData) -> Bool {
        Date().timeIntervalSince1970 > payment.expiresAt
    }

    static func canonicalString(for payment: PaymentData) -> String {
        let amountString = String(format: "%.2f", payment.amount)
        return [
            payment.merchantId,
            payment.network,
            amountString,
            payment.reference,
            String(Int(payment.timestamp)),
            payment.nonce,
            String(payment.ttlSeconds)
        ].joined(separator: "|")
    }
}
