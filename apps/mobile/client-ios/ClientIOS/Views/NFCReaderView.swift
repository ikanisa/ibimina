import SwiftUI

struct NFCReaderView: View {
    @EnvironmentObject private var reader: NFCReaderManager

    var body: some View {
        VStack(spacing: 16) {
            switch reader.state {
            case .idle:
                Text("Ready to scan an NFC tag.")
            case .scanning:
                ProgressView("Scanning...")
            case .completed(let message):
                Text("Tag payload:")
                    .font(.headline)
                ScrollView {
                    Text(message)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                }
            case .failed(let error):
                Label(error.localizedDescription, systemImage: "exclamationmark.triangle")
                    .foregroundColor(.red)
            }

            Button(action: reader.beginScanning) {
                Label("Start Scan", systemImage: "wave.3.backward")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .navigationTitle("NFC Reader")
    }
}

struct NFCReaderView_Previews: PreviewProvider {
    static var previews: some View {
        NFCReaderView()
            .environmentObject(NFCReaderManager())
    }
}
