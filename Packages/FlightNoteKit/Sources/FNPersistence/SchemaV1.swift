import FNDomain
import Foundation
import SwiftData

// Reglas para que el esquema sea compatible con CloudKit (sincronización iCloud futura):
// - todas las propiedades tienen valor por defecto o son opcionales;
// - todas las relaciones son opcionales;
// - no se usa @Attribute(.unique): la unicidad de matrículas la garantiza AircraftRegistry.
// Los enums se guardan como String (`…Raw`) para que las consultas y las migraciones sean estables.

public enum SchemaV1: VersionedSchema {
    public static var versionIdentifier: Schema.Version { Schema.Version(1, 0, 0) }

    public static var models: [any PersistentModel.Type] {
        [Flight.self, Aircraft.self, FlightPhoto.self]
    }

    /// Un vuelo realizado (o previsto) por el usuario.
    @Model
    public final class Flight {
        public var id: UUID = UUID()

        /// Instante de salida. Si no hay hora, es el mediodía local del día del vuelo.
        public var date: Date = Date.now

        // Aerolínea: códigos de la base de referencia + nombre libre (por si no existe en ella).
        public var airlineName: String?
        public var airlineIATA: String?
        public var airlineICAO: String?
        public var flightNumber: String?

        // Origen y destino: código + copia de los datos del aeropuerto en el momento de guardar.
        // Así el historial no se rompe si cambia la base de referencia.
        public var originCode: String = ""
        public var originName: String?
        public var originCity: String?
        public var originCountryISO: String?
        public var originLatitude: Double?
        public var originLongitude: Double?
        public var originTimeZoneID: String?

        public var destinationCode: String = ""
        public var destinationName: String?
        public var destinationCity: String?
        public var destinationCountryISO: String?
        public var destinationLatitude: Double?
        public var destinationLongitude: Double?
        public var destinationTimeZoneID: String?

        // Horarios (instantes absolutos; se muestran en la zona horaria de cada aeropuerto).
        public var scheduledDeparture: Date?
        public var scheduledArrival: Date?
        public var actualDeparture: Date?
        public var actualArrival: Date?
        /// Duración introducida a mano. Tiene prioridad sobre la calculada.
        public var durationMinutesManual: Int?

        /// Distancia ortodrómica entre origen y destino, en km.
        public var distanceKm: Double = 0

        public var cabinClassRaw: String = CabinClass.economy.rawValue
        public var seat: String?
        public var seatPositionRaw: String?
        public var terminal: String?
        public var gate: String?
        public var reasonRaw: String?
        public var notes: String?

        // Aeronave tal como se voló. Se guarda aunque no se conozca la matrícula.
        public var aircraftTypeICAO: String?
        public var aircraftManufacturer: String?
        public var aircraftModel: String?
        public var aircraftVariant: String?

        /// Ficha de la matrícula (una por avión, compartida entre vuelos).
        public var aircraft: Aircraft?

        @Relationship(deleteRule: .cascade, inverse: \FlightPhoto.flight)
        public var photos: [FlightPhoto]? = []

        public var createdAt: Date = Date.now
        public var updatedAt: Date = Date.now

        public init(date: Date, originCode: String, destinationCode: String) {
            self.date = date
            self.originCode = originCode
            self.destinationCode = destinationCode
        }
    }

    /// Una aeronave concreta, identificada por su matrícula.
    @Model
    public final class Aircraft {
        public var id: UUID = UUID()
        /// Matrícula tal como la escribe el usuario: "CC-BGG".
        public var registration: String = ""
        /// Clave normalizada para detectar duplicados: "CCBGG".
        public var registrationKey: String = ""

        public var typeICAO: String?
        public var manufacturer: String?
        public var model: String?
        public var variant: String?
        /// Nombre comercial o de bautismo del avión.
        public var name: String?
        public var operatorName: String?
        public var registrationCountryISO: String?
        public var notes: String?

        @Attribute(.externalStorage)
        public var photoData: Data?

        @Relationship(deleteRule: .nullify, inverse: \Flight.aircraft)
        public var flights: [Flight]? = []

        public var createdAt: Date = Date.now
        public var updatedAt: Date = Date.now

        public init(registration: String) {
            self.registration = Registration.displayForm(registration)
            self.registrationKey = Registration.normalizedKey(registration)
        }
    }

    /// Fotografía adjunta a un vuelo.
    @Model
    public final class FlightPhoto {
        public var id: UUID = UUID()
        @Attribute(.externalStorage)
        public var imageData: Data?
        public var thumbnailData: Data?
        public var caption: String?
        public var takenAt: Date?
        public var sortIndex: Int = 0
        public var flight: Flight?
        public var createdAt: Date = Date.now

        public init(imageData: Data?, thumbnailData: Data? = nil) {
            self.imageData = imageData
            self.thumbnailData = thumbnailData
        }
    }
}

public typealias Flight = SchemaV1.Flight
public typealias Aircraft = SchemaV1.Aircraft
public typealias FlightPhoto = SchemaV1.FlightPhoto
