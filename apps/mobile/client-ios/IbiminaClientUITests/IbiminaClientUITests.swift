import XCTest

final class IbiminaClientUITests: XCTestCase {
    func testLaunchShowsPrimaryActions() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.buttons["Scan NFC Payment"].exists)
        XCTAssertTrue(app.buttons["Create Payment Tag"].exists)
    }
}
