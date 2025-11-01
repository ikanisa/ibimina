import Foundation

public protocol TimeProviding {
    func now() -> Date
}

public struct SystemTimeProvider: TimeProviding {
    public init() {}
    public func now() -> Date { Date() }
}

public enum TimeUtils {
    public static func validatePayloadTtl(
        timestamp: Int64,
        allowedDelayMilliseconds: Int,
        now: Date
    ) -> Bool {
        let payloadDate = Date(timeIntervalSince1970: TimeInterval(timestamp) / 1000.0)
        let delta = now.timeIntervalSince(payloadDate)
        return abs(delta) * 1000.0 <= Double(allowedDelayMilliseconds)
    }
}
