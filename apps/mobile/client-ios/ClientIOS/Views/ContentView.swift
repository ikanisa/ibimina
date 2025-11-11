import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var supabase: SupabaseService

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Client iOS")
                    .font(.largeTitle)
                    .bold()

                Text("Authenticate with Supabase and interact with NFC tags.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)

                NavigationLink(destination: TransactionsView()) {
                    Label("Transactions", systemImage: "list.bullet")
                }
                .buttonStyle(.borderedProminent)

                NavigationLink(destination: NFCReaderView()) {
                    Label("Read NFC", systemImage: "wave.3.backward")
                }
                .buttonStyle(.borderedProminent)

                NavigationLink(destination: NFCWriterView()) {
                    Label("Write NFC", systemImage: "square.and.pencil")
                }
                .buttonStyle(.borderedProminent)

                Spacer()
            }
            .padding()
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: supabase.signInAnonymously) {
                        Label("Sign In", systemImage: "person.crop.circle.badge.checkmark")
                    }
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(SupabaseService.shared)
            .environmentObject(NFCReaderManager())
            .environmentObject(NFCWriterManager())
    }
}
