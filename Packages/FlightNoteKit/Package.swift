// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "FlightNoteKit",
    defaultLocalization: "es",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [
        .library(name: "FNDomain", targets: ["FNDomain"]),
        .library(name: "FNReferenceData", targets: ["FNReferenceData"]),
        .library(name: "FNPersistence", targets: ["FNPersistence"]),
    ],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0"),
    ],
    targets: [
        // Lógica pura, sin dependencias. Swift 6 estricto.
        .target(name: "FNDomain"),
        // Base aeronáutica de solo lectura incluida en la app.
        .target(
            name: "FNReferenceData",
            dependencies: ["FNDomain", .product(name: "GRDB", package: "GRDB.swift")],
            resources: [.copy("Resources/reference.sqlite")]
        ),
        // Datos del usuario (SwiftData). Modo Swift 5 hasta validar la concurrencia estricta con SwiftData (ver ADR 0002).
        .target(
            name: "FNPersistence",
            dependencies: ["FNDomain"],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(name: "FNDomainTests", dependencies: ["FNDomain"]),
        .testTarget(name: "FNReferenceDataTests", dependencies: ["FNReferenceData"]),
        .testTarget(
            name: "FNPersistenceTests",
            dependencies: ["FNPersistence"],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
    ]
)
