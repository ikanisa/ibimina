import SwiftUI

struct NFCWriterView: View {
    @EnvironmentObject private var writer: NFCWriterManager
    @State private var message: String = ""

    var body: some View {
        Form {
            Section(header: Text("Message")) {
                TextField("Enter text", text: $message)
            }

            Section {
                Button {
                    writer.beginWriting(message: message)
                } label: {
                    Label("Write Tag", systemImage: "square.and.pencil")
                }
                .disabled(message.isEmpty)
            }

            Section(header: Text("Status")) {
                switch writer.state {
                case .idle:
                    Label("Idle", systemImage: "pause")
                case .writing:
                    Label("Writing", systemImage: "pencil")
                case .completed:
                    Label("Completed", systemImage: "checkmark.circle")
                        .foregroundColor(.green)
                case .failed(let error):
                    Label(error.localizedDescription, systemImage: "exclamationmark.triangle")
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("NFC Writer")
    }
}

struct NFCWriterView_Previews: PreviewProvider {
    static var previews: some View {
        NFCWriterView()
            .environmentObject(NFCWriterManager())
    }
}
