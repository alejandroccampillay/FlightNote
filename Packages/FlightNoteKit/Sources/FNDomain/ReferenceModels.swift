import Foundation

/// Aeropuerto de la base de referencia.
public struct AirportInfo: Hashable, Sendable, Identifiable {
    public var id: Int
    public var ident: String
    public var iata: String?
    public var icao: String?
    public var name: String
    public var city: String?
    public var countryISO: String
    public var region: String?
    /// Continente según OurAirports: AF, AN, AS, EU, NA, OC, SA.
    public var continent: String
    public var coordinate: GeoCoordinate
    public var elevationFt: Int?
    public var timeZoneID: String?
    /// large, medium, small, seaplane_base
    public var kind: String
    public var hasScheduledService: Bool

    public init(
        id: Int, ident: String, iata: String?, icao: String?, name: String, city: String?,
        countryISO: String, region: String?, continent: String, coordinate: GeoCoordinate,
        elevationFt: Int?, timeZoneID: String?, kind: String, hasScheduledService: Bool
    ) {
        self.id = id
        self.ident = ident
        self.iata = iata
        self.icao = icao
        self.name = name
        self.city = city
        self.countryISO = countryISO
        self.region = region
        self.continent = continent
        self.coordinate = coordinate
        self.elevationFt = elevationFt
        self.timeZoneID = timeZoneID
        self.kind = kind
        self.hasScheduledService = hasScheduledService
    }

    /// Código preferente para mostrar: IATA, ICAO o identificador interno.
    public var displayCode: String { iata ?? icao ?? ident }

    public var timeZone: TimeZone? { timeZoneID.flatMap(TimeZone.init(identifier:)) }
}

/// Aerolínea de la base de referencia.
public struct AirlineInfo: Hashable, Sendable, Identifiable {
    public var id: Int
    public var name: String
    public var alias: String?
    public var iata: String?
    public var icao: String?
    public var callsign: String?
    public var countryISO: String?
    public var isActive: Bool

    public init(
        id: Int, name: String, alias: String?, iata: String?, icao: String?,
        callsign: String?, countryISO: String?, isActive: Bool
    ) {
        self.id = id
        self.name = name
        self.alias = alias
        self.iata = iata
        self.icao = icao
        self.callsign = callsign
        self.countryISO = countryISO
        self.isActive = isActive
    }
}

/// Tipo de aeronave (designador OACI).
public struct AircraftTypeInfo: Hashable, Sendable, Identifiable {
    public var icao: String
    public var manufacturer: String
    public var model: String
    public var variant: String
    /// narrowbody, widebody, regional, turboprop, other
    public var category: String

    public var id: String { icao }

    public init(icao: String, manufacturer: String, model: String, variant: String, category: String) {
        self.icao = icao
        self.manufacturer = manufacturer
        self.model = model
        self.variant = variant
        self.category = category
    }
}

/// Fuente de datos aeronáuticos de referencia. La implementación por defecto es local (SQLite).
/// Se podrán añadir otras fuentes sin tocar el resto de la app.
public protocol ReferenceDataProvider: Sendable {
    func airport(code: String) throws -> AirportInfo?
    func searchAirports(_ query: String, limit: Int) throws -> [AirportInfo]
    func airline(code: String) throws -> AirlineInfo?
    func searchAirlines(_ query: String, limit: Int) throws -> [AirlineInfo]
    func aircraftType(icao: String) throws -> AircraftTypeInfo?
    func searchAircraftTypes(_ query: String, limit: Int) throws -> [AircraftTypeInfo]
    func registrationPrefixes() throws -> [RegistrationPrefix]
}
