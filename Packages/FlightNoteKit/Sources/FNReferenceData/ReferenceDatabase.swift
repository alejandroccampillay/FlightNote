import FNDomain
import Foundation
import GRDB

public enum ReferenceDatabaseError: Error {
    case missingResource
}

/// Resumen del contenido de la base de referencia (para Ajustes y diagnósticos).
public struct ReferenceStatistics: Sendable, Equatable {
    public var airports: Int
    public var airlines: Int
    public var aircraftTypes: Int
    public var schemaVersion: Int
    public var builtAt: String
}

/// Base aeronáutica de solo lectura incluida en la app (`reference.sqlite`).
public final class ReferenceDatabase: ReferenceDataProvider, Sendable {
    private let dbQueue: DatabaseQueue

    /// Abre la base incluida en el paquete.
    public static func bundled() throws -> ReferenceDatabase {
        guard let url = Bundle.module.url(forResource: "reference", withExtension: "sqlite") else {
            throw ReferenceDatabaseError.missingResource
        }
        return try ReferenceDatabase(path: url.path)
    }

    public init(path: String) throws {
        var configuration = Configuration()
        configuration.readonly = true
        dbQueue = try DatabaseQueue(path: path, configuration: configuration)
    }

    // MARK: - Estadísticas

    public func statistics() throws -> ReferenceStatistics {
        try dbQueue.read { db in
            let meta = try Dictionary(
                uniqueKeysWithValues: Row.fetchAll(db, sql: "SELECT key, value FROM meta").map {
                    (($0["key"] as String?) ?? "", ($0["value"] as String?) ?? "")
                }
            )
            return ReferenceStatistics(
                airports: try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM airport") ?? 0,
                airlines: try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM airline") ?? 0,
                aircraftTypes: try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM aircraft_type") ?? 0,
                schemaVersion: Int(meta["schema_version"] ?? "") ?? 0,
                builtAt: meta["built_at"] ?? ""
            )
        }
    }

    // MARK: - Aeropuertos

    public func airport(code: String) throws -> AirportInfo? {
        let code = Self.normalizedCode(code)
        guard !code.isEmpty else { return nil }
        let column = switch code.count {
        case 3: "iata"
        case 4: "icao"
        default: "ident"
        }
        return try dbQueue.read { db in
            try Row.fetchOne(db, sql: "SELECT * FROM airport WHERE \(column) = ? ORDER BY rank LIMIT 1", arguments: [code])
                .map(Self.airport(from:))
        }
    }

    public func searchAirports(_ query: String, limit: Int = 20) throws -> [AirportInfo] {
        let (filter, arguments) = Self.tokenFilter(query)
        guard !filter.isEmpty else { return [] }
        let code = Self.normalizedCode(query)
        let sql = """
            SELECT * FROM airport WHERE \(filter)
            ORDER BY CASE WHEN iata = ? THEN 0 WHEN icao = ? THEN 1 ELSE 2 END, rank, scheduled DESC, name
            LIMIT ?
            """
        return try dbQueue.read { db in
            try Row.fetchAll(db, sql: sql, arguments: StatementArguments(arguments + [code, code, limit]))
                .map(Self.airport(from:))
        }
    }

    // MARK: - Aerolíneas

    public func airline(code: String) throws -> AirlineInfo? {
        let code = Self.normalizedCode(code)
        let column: String
        switch code.count {
        case 2: column = "iata"
        case 3: column = "icao"
        default: return nil
        }
        return try dbQueue.read { db in
            try Row.fetchOne(db, sql: "SELECT * FROM airline WHERE \(column) = ? ORDER BY active DESC, id LIMIT 1", arguments: [code])
                .map(Self.airline(from:))
        }
    }

    public func searchAirlines(_ query: String, limit: Int = 20) throws -> [AirlineInfo] {
        let (filter, arguments) = Self.tokenFilter(query)
        guard !filter.isEmpty else { return [] }
        let code = Self.normalizedCode(query)
        let sql = """
            SELECT * FROM airline WHERE \(filter)
            ORDER BY CASE WHEN iata = ? THEN 0 WHEN icao = ? THEN 1 ELSE 2 END, active DESC, name
            LIMIT ?
            """
        return try dbQueue.read { db in
            try Row.fetchAll(db, sql: sql, arguments: StatementArguments(arguments + [code, code, limit]))
                .map(Self.airline(from:))
        }
    }

    // MARK: - Tipos de aeronave

    public func aircraftType(icao: String) throws -> AircraftTypeInfo? {
        let code = Self.normalizedCode(icao)
        return try dbQueue.read { db in
            try Row.fetchOne(db, sql: "SELECT * FROM aircraft_type WHERE icao = ?", arguments: [code])
                .map(Self.aircraftType(from:))
        }
    }

    public func searchAircraftTypes(_ query: String, limit: Int = 20) throws -> [AircraftTypeInfo] {
        let (filter, arguments) = Self.tokenFilter(query)
        guard !filter.isEmpty else { return [] }
        let code = Self.normalizedCode(query)
        let sql = """
            SELECT * FROM aircraft_type WHERE \(filter)
            ORDER BY CASE WHEN icao = ? THEN 0 ELSE 1 END, manufacturer, variant
            LIMIT ?
            """
        return try dbQueue.read { db in
            try Row.fetchAll(db, sql: sql, arguments: StatementArguments(arguments + [code, limit]))
                .map(Self.aircraftType(from:))
        }
    }

    // MARK: - Matrículas

    public func registrationPrefixes() throws -> [RegistrationPrefix] {
        try dbQueue.read { db in
            try Row.fetchAll(db, sql: "SELECT prefix, country_iso FROM registration_prefix").map {
                RegistrationPrefix(prefix: $0["prefix"], countryISO: $0["country_iso"])
            }
        }
    }

    // MARK: - Ayudantes

    static func normalizedCode(_ text: String) -> String {
        text.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    }

    /// Una condición `search_text LIKE '%palabra%'` por cada palabra de la consulta.
    static func tokenFilter(_ query: String) -> (String, [(any DatabaseValueConvertible)?]) {
        let tokens = SearchText.tokens(query)
        let filter = tokens.map { _ in "search_text LIKE ? ESCAPE '\\'" }.joined(separator: " AND ")
        let arguments: [(any DatabaseValueConvertible)?] = tokens.map { "%" + escapeLike($0) + "%" }
        return (filter, arguments)
    }

    static func escapeLike(_ text: String) -> String {
        text.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "%", with: "\\%")
            .replacingOccurrences(of: "_", with: "\\_")
    }

    static func airport(from row: Row) -> AirportInfo {
        AirportInfo(
            id: row["id"],
            ident: row["ident"],
            iata: row["iata"],
            icao: row["icao"],
            name: row["name"],
            city: row["city"],
            countryISO: row["country_iso"],
            region: row["region"],
            continent: row["continent"],
            coordinate: GeoCoordinate(latitude: row["latitude"], longitude: row["longitude"]),
            elevationFt: row["elevation_ft"],
            timeZoneID: row["time_zone"],
            kind: row["kind"],
            hasScheduledService: row["scheduled"]
        )
    }

    static func airline(from row: Row) -> AirlineInfo {
        AirlineInfo(
            id: row["id"],
            name: row["name"],
            alias: row["alias"],
            iata: row["iata"],
            icao: row["icao"],
            callsign: row["callsign"],
            countryISO: row["country_iso"],
            isActive: row["active"]
        )
    }

    static func aircraftType(from row: Row) -> AircraftTypeInfo {
        AircraftTypeInfo(
            icao: row["icao"],
            manufacturer: row["manufacturer"],
            model: row["model"],
            variant: row["variant"],
            category: row["category"]
        )
    }
}
