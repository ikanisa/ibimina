import Foundation

public struct ISO7816Response: Equatable {
    public let data: Data
    public let sw1: UInt8
    public let sw2: UInt8

    public init(data: Data, sw1: UInt8, sw2: UInt8) {
        self.data = data
        self.sw1 = sw1
        self.sw2 = sw2
    }
}

public protocol ISO7816TagCommunicating {
    func selectAid(_ aid: Data, completion: @escaping (Result<ISO7816Response, Error>) -> Void)
}

public protocol TagReaderSessionProvider: AnyObject {
    var isAvailable: Bool { get }
    func setAlertMessage(_ message: String)
    func beginSession(delegate: TagReaderSessionDelegate)
    func invalidateSession(errorMessage: String?)
}

public protocol TagReaderSessionDelegate: AnyObject {
    func tagReaderSessionDidBecomeActive(_ provider: TagReaderSessionProvider)
    func tagReaderSession(_ provider: TagReaderSessionProvider, didDetect tag: ISO7816TagCommunicating)
    func tagReaderSession(_ provider: TagReaderSessionProvider, didInvalidateWith error: Error?)
    func tagReaderSessionDetectedUnsupportedTag(_ provider: TagReaderSessionProvider)
}

public final class UnavailableTagReaderSessionProvider: TagReaderSessionProvider {
    public init() {}

    public var isAvailable: Bool { false }
    public func setAlertMessage(_ message: String) {}
    public func beginSession(delegate: TagReaderSessionDelegate) {
        delegate.tagReaderSessionDetectedUnsupportedTag(self)
    }
    public func invalidateSession(errorMessage: String?) {}
}
