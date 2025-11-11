import SwiftUI

@main
struct ClientIOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(SupabaseService.shared)
                .environmentObject(NFCReaderManager())
                .environmentObject(NFCWriterManager())
        }
    }
}
