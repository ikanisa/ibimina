import SwiftUI
import CoreNFC

/**
 * ContentView - Main view for Ibimina Client iOS app
 * 
 * Features:
 * - NFC payment handling (TapMoMo)
 * - View groups and transactions
 * - Member profile
 */
struct ContentView: View {
    
    @StateObject private var nfcReader = NFCReaderManager()
    @StateObject private var nfcWriter = NFCWriterManager()
    @State private var nfcData: String = ""
    @State private var showingReader = false
    @State private var showingWriter = false
    @State private var paymentData: PaymentData?
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // App Header
                VStack(spacing: 8) {
                    Image(systemName: "person.3.fill")
                        .font(.system(size: 64))
                        .foregroundColor(.blue)
                    
                    Text("Ibimina Client")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Your Groups & Savings")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // NFC Actions
                VStack(spacing: 16) {
                    // Read NFC Tag
                    Button(action: {
                        startNFCReader()
                    }) {
                        HStack {
                            Image(systemName: "wave.3.right")
                            Text("Scan NFC Payment")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!NFCReaderManager.isAvailable)
                    
                    // Write NFC Tag
                    Button(action: {
                        startNFCWriter()
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                            Text("Create Payment Tag")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!NFCWriterManager.isAvailable)
                    
                    // View Groups
                    NavigationLink(destination: GroupsListView()) {
                        HStack {
                            Image(systemName: "person.3")
                            Text("My Groups")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    
                    // View Transactions
                    NavigationLink(destination: TransactionsListView()) {
                        HStack {
                            Image(systemName: "list.bullet.rectangle")
                            Text("Transaction History")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 24)
                
                // NFC Data Display
                if !nfcData.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Last Scanned:")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Text(nfcData)
                            .font(.system(.body, design: .monospaced))
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .padding(.horizontal, 24)
                }
                
                // Error Message
                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 24)
                }
                
                Spacer()
                
                // NFC Availability Info
                if !NFCReaderManager.isAvailable {
                    Text("NFC is not available on this device")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding()
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    // MARK: - NFC Reader
    
    private func startNFCReader() {
        errorMessage = nil
        nfcReader.onTagRead = { data in
            self.nfcData = data
            
            // Parse payment data
            if let payment = NFCTagHandler.parsePaymentData(data) {
                self.paymentData = payment
                
                // Verify signature and TTL
                if NFCTagHandler.isPaymentExpired(payment) {
                    self.errorMessage = "Payment request expired (over 2 minutes old)"
                }
            }
        }
        
        nfcReader.onError = { error in
            self.errorMessage = error
        }
        
        nfcReader.beginScanning()
    }
    
    // MARK: - NFC Writer
    
    private func startNFCWriter() {
        errorMessage = nil
        
        // Create sample payment data
        let payment = PaymentData(
            amount: 5000.0,
            network: "MTN",
            merchant_id: "SACCO123",
            reference: "REF\(Int(Date().timeIntervalSince1970))",
            timestamp: Date().timeIntervalSince1970,
            nonce: UUID().uuidString,
            signature: nil
        )
        
        guard let paymentJSON = NFCTagHandler.formatPaymentData(payment) else {
            errorMessage = "Failed to format payment data"
            return
        }
        
        nfcWriter.onWriteSuccess = {
            self.nfcData = "Payment tag created successfully"
        }
        
        nfcWriter.onWriteError = { error in
            self.errorMessage = error
        }
        
        nfcWriter.beginWriting(data: paymentJSON)
    }
}

// MARK: - Placeholder Views

struct GroupsListView: View {
    var body: some View {
        Text("Groups List")
            .navigationTitle("My Groups")
    }
}

struct TransactionsListView: View {
    var body: some View {
        Text("Transactions List")
            .navigationTitle("Transactions")
    }
}

// MARK: - Preview

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
