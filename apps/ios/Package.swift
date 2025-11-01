// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "IbiminaIOS",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "TapMoMoKit",
            targets: ["TapMoMoKit"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-crypto.git", from: "3.1.0")
    ],
    targets: [
        .target(
            name: "TapMoMoKit",
            dependencies: [
                .product(name: "Crypto", package: "swift-crypto")
            ],
            path: "Sources"
        ),
        .testTarget(
            name: "TapMoMoKitTests",
            dependencies: ["TapMoMoKit"],
            path: "Tests"
        )
    ]
)
