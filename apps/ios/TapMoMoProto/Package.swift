// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "TapMoMoProto",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "TapMoMoProto",
            targets: ["TapMoMoProto"]
        )
    ],
    targets: [
        .target(
            name: "TapMoMoProto",
            dependencies: [],
            path: "Sources",
            swiftSettings: [
                .define("SWIFT_PACKAGE")
            ]
        ),
        .testTarget(
            name: "TapMoMoProtoTests",
            dependencies: ["TapMoMoProto"],
            path: "Tests"
        )
    ]
)
