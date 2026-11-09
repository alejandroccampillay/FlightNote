import FNDomain
import Foundation
import SwiftData

/// Plan de migraciones. Cada cambio de esquema añade una versión y una etapa aquí,
/// nunca se modifica un esquema ya publicado.
public enum FlightNoteMigrationPlan: SchemaMigrationPlan {
    public static var schemas: [any VersionedSchema.Type] { [SchemaV1.self] }
    public static var stages: [MigrationStage] { [] }
}

public enum PersistenceController {
    /// Crea el contenedor de datos del usuario.
    /// - Parameters:
    ///   - inMemory: para tests y para las pruebas de UI.
    ///   - name: nombre del almacén (tests: uno distinto por test).
    public static func makeContainer(inMemory: Bool = false, name: String = "FlightNote") throws -> ModelContainer {
        let schema = Schema(versionedSchema: SchemaV1.self)
        // iCloud desactivado hasta tener cuenta de Apple Developer (ver ADR 0001).
        let configuration = ModelConfiguration(
            name,
            schema: schema,
            isStoredInMemoryOnly: inMemory,
            cloudKitDatabase: .none
        )
        return try ModelContainer(
            for: schema,
            migrationPlan: FlightNoteMigrationPlan.self,
            configurations: [configuration]
        )
    }
}

// MARK: - Ayudantes de Flight

extension SchemaV1.Flight {
    public var cabinClass: CabinClass {
        get { CabinClass(rawValue: cabinClassRaw) ?? .other }
        set { cabinClassRaw = newValue.rawValue }
    }

    public var seatPosition: SeatPosition? {
        get { seatPositionRaw.flatMap(SeatPosition.init(rawValue:)) }
        set { seatPositionRaw = newValue?.rawValue }
    }

    public var reason: TravelReason? {
        get { reasonRaw.flatMap(TravelReason.init(rawValue:)) }
        set { reasonRaw = newValue?.rawValue }
    }

    public var originCoordinate: GeoCoordinate? {
        guard let lat = originLatitude, let lon = originLongitude else { return nil }
        return GeoCoordinate(latitude: lat, longitude: lon)
    }

    public var destinationCoordinate: GeoCoordinate? {
        guard let lat = destinationLatitude, let lon = destinationLongitude else { return nil }
        return GeoCoordinate(latitude: lat, longitude: lon)
    }

    /// Copia los datos del aeropuerto de origen en el vuelo y recalcula la distancia.
    public func setOrigin(_ airport: AirportInfo) {
        originCode = airport.displayCode
        originName = airport.name
        originCity = airport.city
        originCountryISO = airport.countryISO
        originLatitude = airport.coordinate.latitude
        originLongitude = airport.coordinate.longitude
        originTimeZoneID = airport.timeZoneID
        recomputeDistance()
    }

    /// Copia los datos del aeropuerto de destino en el vuelo y recalcula la distancia.
    public func setDestination(_ airport: AirportInfo) {
        destinationCode = airport.displayCode
        destinationName = airport.name
        destinationCity = airport.city
        destinationCountryISO = airport.countryISO
        destinationLatitude = airport.coordinate.latitude
        destinationLongitude = airport.coordinate.longitude
        destinationTimeZoneID = airport.timeZoneID
        recomputeDistance()
    }

    public func recomputeDistance() {
        guard let a = originCoordinate, let b = destinationCoordinate else {
            distanceKm = 0
            return
        }
        distanceKm = GreatCircle.distanceKm(from: a, to: b)
    }

    /// Duración del vuelo: la manual si existe; si no, la de las horas reales o, en su defecto, las programadas.
    public var durationMinutes: Int? {
        if let manual = durationMinutesManual { return manual }
        for (start, end) in [(actualDeparture, actualArrival), (scheduledDeparture, scheduledArrival)] {
            if let start, let end {
                let minutes = Int((end.timeIntervalSince(start) / 60).rounded())
                if minutes > 0, minutes <= FlightTiming.maximumMinutes { return minutes }
            }
        }
        return nil
    }
}
