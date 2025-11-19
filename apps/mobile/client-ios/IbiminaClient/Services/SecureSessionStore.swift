import Foundation
import KeychainAccess
import Supabase

/// Persists Supabase sessions in the system keychain.
final class SecureSessionStore {
    private let keychain = Keychain(service: "com.ibimina.client.session")
    private let sessionKey = "supabase_session"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func save(_ session: Session) {
        do {
            let data = try encoder.encode(session)
            try keychain.set(data, key: sessionKey)
        } catch {
            print("secure-session.save_failed", error.localizedDescription)
        }
    }

    func load() -> Session? {
        do {
            guard let data = try keychain.getData(sessionKey) else { return nil }
            return try decoder.decode(Session.self, from: data)
        } catch {
            print("secure-session.load_failed", error.localizedDescription)
            return nil
        }
    }

    func clear() {
        do {
            try keychain.remove(sessionKey)
        } catch {
            print("secure-session.clear_failed", error.localizedDescription)
        }
    }
}
