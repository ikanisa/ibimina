import CoreNFC
import Foundation

/**
 * NFCTagHandler provides utility functions for working with NFC tags
 * 
 * Features:
 * - Tag validation
 * - Data parsing
 * - Format detection
 */
class NFCTagHandler {
    
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
                let requiredFields = ["amount", "network", "merchant_id", "reference"]
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
    static func calculateHMAC(data: String, secret: String) -> String {
        // In production, implement proper HMAC-SHA256
        // For now, return a placeholder
        return "hmac_placeholder"
    }
    
    /**
     * Verify HMAC signature
     */
    static func verifyHMAC(data: String, signature: String, secret: String) -> Bool {
        let calculatedHMAC = calculateHMAC(data: data, secret: secret)
        return calculatedHMAC == signature
    }
    
    /**
     * Check if payment data is expired (TTL)
     */
    static func isPaymentExpired(_ payment: PaymentData, ttlSeconds: Int = 120) -> Bool {
        let currentTime = Date().timeIntervalSince1970
        return currentTime - payment.timestamp > Double(ttlSeconds)
    }
}
