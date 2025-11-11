import UIKit
import Combine

final class AppDelegate: NSObject, UIApplicationDelegate {
    private var cancellables = Set<AnyCancellable>()

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        configureAppearance()
        SupabaseService.shared.$isAuthenticated
            .sink { isAuthenticated in
                let status = isAuthenticated ? "authenticated" : "unauthenticated"
                print("[AppDelegate] Supabase authentication state: \(status)")
            }
            .store(in: &cancellables)
        return true
    }

    private func configureAppearance() {
        UINavigationBar.appearance().tintColor = .label
    }
}
