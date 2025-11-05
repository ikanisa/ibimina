import Foundation

struct StartWhatsAppResponse: Decodable {
    let attemptId: String
    let expiresIn: Int
    let resendIn: Int?
}

struct VerifyWhatsAppResponse: Decodable {
    let token: String
    let refreshToken: String?
    let expiresIn: Int?
}

protocol AuthNetworking {
    func start(number: String) async throws -> StartWhatsAppResponse
    func verify(number: String, code: String, attemptId: String?) async throws -> VerifyWhatsAppResponse
}

final class AuthAPI: AuthNetworking {
    private let session: URLSession
    private let baseURL: URL

    init(baseURL: URL = URL(string: "https://api.example.com")!, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func start(number: String) async throws -> StartWhatsAppResponse {
        let body = ["whatsappNumber": number]
        let request = try makeRequest(path: "/auth/whatsapp/start", body: body)
        let (data, response) = try await session.data(for: request)
        try validate(response: response)
        return try JSONDecoder().decode(StartWhatsAppResponse.self, from: data)
    }

    func verify(number: String, code: String, attemptId: String?) async throws -> VerifyWhatsAppResponse {
        let body: [String: Any?] = [
            "whatsappNumber": number,
            "code": code,
            "attemptId": attemptId
        ]
        let request = try makeRequest(path: "/auth/whatsapp/verify", body: body)
        let (data, response) = try await session.data(for: request)
        try validate(response: response)
        return try JSONDecoder().decode(VerifyWhatsAppResponse.self, from: data)
    }

    private func makeRequest(path: String, body: [String: Any?]) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw NSError(domain: "AuthAPI", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL path"])
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
        return request
    }

    private func validate(response: URLResponse) throws {
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw NSError(domain: "AuthAPI", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: "Request failed with status code \(http.statusCode)"])
        }
    }
}
