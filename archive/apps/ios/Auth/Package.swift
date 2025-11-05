// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "IbiminaAuthKit",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "IbiminaAuthKit",
            targets: ["IbiminaAuthKit"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "IbiminaAuthKit",
            dependencies: [],
            path: "Sources"
        ),
        .testTarget(
            name: "IbiminaAuthKitTests",
            dependencies: ["IbiminaAuthKit"],
            path: "Tests"
        )
    ]
)
