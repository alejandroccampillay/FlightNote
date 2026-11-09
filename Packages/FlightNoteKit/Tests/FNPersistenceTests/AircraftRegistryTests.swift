import FNDomain
import Foundation
import SwiftData
import Testing
@testable import FNPersistence

/// Cada test usa su propio almacén en memoria.
private func makeStore() throws -> (ModelContainer, ModelContext) {
    let container = try PersistenceController.makeContainer(inMemory: true, name: UUID().uuidString)
    return (container, ModelContext(container))
}

private let scl = AirportInfo(
    id: 1, ident: "SCEL", iata: "SCL", icao: "SCEL", name: "Arturo Merino Benítez", city: "Santiago",
    countryISO: "CL", region: nil, continent: "SA",
    coordinate: GeoCoordinate(latitude: -33.393001556396484, longitude: -70.78579711914062),
    elevationFt: 1555, timeZoneID: "America/Santiago", kind: "large", hasScheduledService: true
)
private let mad = AirportInfo(
    id: 2, ident: "LEMD", iata: "MAD", icao: "LEMD", name: "Madrid-Barajas", city: "Madrid",
    countryISO: "ES", region: nil, continent: "EU",
    coordinate: GeoCoordinate(latitude: 40.493407, longitude: -3.572249),
    elevationFt: 1998, timeZoneID: "Europe/Madrid", kind: "large", hasScheduledService: true
)

struct AircraftRegistryTests {
    @Test func sameRegistrationIsSharedAcrossFlights() throws {
        let (_, context) = try makeStore()
        let registry = AircraftRegistry(context: context)

        let outbound = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        outbound.aircraftTypeICAO = "B789"
        outbound.aircraftManufacturer = "Boeing"
        outbound.aircraftVariant = "787-9"
        let inbound = Flight(date: .now, originCode: "MAD", destinationCode: "SCL")
        context.insert(outbound)
        context.insert(inbound)

        try registry.assign(registration: "CC-BGG", to: outbound)
        try registry.assign(registration: "cc bgg", to: inbound)
        try context.save()

        let all = try context.fetch(FetchDescriptor<Aircraft>())
        #expect(all.count == 1)
        let aircraft = try #require(all.first)
        #expect(aircraft.registration == "CC-BGG")
        #expect(aircraft.registrationKey == "CCBGG")
        #expect(aircraft.flights?.count == 2)
        #expect(aircraft.typeICAO == "B789")
        #expect(aircraft.variant == "787-9")
    }

    @Test func emptyRegistrationDetachesAircraft() throws {
        let (_, context) = try makeStore()
        let registry = AircraftRegistry(context: context)
        let flight = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        context.insert(flight)
        try registry.assign(registration: "CC-BGG", to: flight)
        try registry.assign(registration: "  ", to: flight)
        #expect(flight.aircraft == nil)
        #expect(try registry.findOrCreate(registration: "--") == nil)
    }

    @Test func duplicatesAreMergedWithoutLosingFlights() throws {
        let (_, context) = try makeStore()
        let registry = AircraftRegistry(context: context)

        // Simula dos fichas creadas fuera del registro (p. ej., llegadas por sincronización).
        let first = Aircraft(registration: "HB-JCM")
        first.createdAt = Date(timeIntervalSince1970: 0)
        let second = Aircraft(registration: "hbjcm")
        second.manufacturer = "Airbus"
        second.notes = "Asiento 7A"
        context.insert(first)
        context.insert(second)

        let f1 = Flight(date: .now, originCode: "ZRH", destinationCode: "LHR")
        let f2 = Flight(date: .now, originCode: "LHR", destinationCode: "ZRH")
        context.insert(f1)
        context.insert(f2)
        f1.aircraft = first
        f2.aircraft = second
        try context.save()

        #expect(try registry.duplicateGroups().count == 1)
        #expect(try registry.mergeAllDuplicates() == 1)
        try context.save()

        let all = try context.fetch(FetchDescriptor<Aircraft>())
        #expect(all.count == 1)
        let survivor = try #require(all.first)
        #expect(survivor.registration == "HB-JCM")
        #expect(survivor.manufacturer == "Airbus")
        #expect(survivor.notes == "Asiento 7A")
        #expect(survivor.flights?.count == 2)
        #expect(try registry.duplicateGroups().isEmpty)
    }

    @Test func deletingFlightKeepsAircraftAndDeletingAircraftKeepsFlights() throws {
        let (_, context) = try makeStore()
        let registry = AircraftRegistry(context: context)
        let f1 = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        let f2 = Flight(date: .now, originCode: "MAD", destinationCode: "SCL")
        context.insert(f1)
        context.insert(f2)
        try registry.assign(registration: "CC-BGG", to: f1)
        try registry.assign(registration: "CC-BGG", to: f2)
        try context.save()

        context.delete(f1)
        try context.save()
        let aircraft = try #require(try registry.aircraft(registration: "CCBGG"))
        #expect(aircraft.flights?.count == 1)

        context.delete(aircraft)
        try context.save()
        #expect(try context.fetch(FetchDescriptor<Flight>()).count == 1)
        #expect(f2.aircraft == nil)
    }
}

struct FlightModelTests {
    @Test func settingAirportsCopiesDataAndComputesDistance() throws {
        let (_, context) = try makeStore()
        let flight = Flight(date: .now, originCode: "", destinationCode: "")
        context.insert(flight)
        flight.setOrigin(scl)
        flight.setDestination(mad)

        #expect(flight.originCode == "SCL")
        #expect(flight.destinationTimeZoneID == "Europe/Madrid")
        #expect(abs(flight.distanceKm - 10_719.3) < 1)
    }

    @Test func durationPrefersManualThenActualThenScheduled() throws {
        let (_, context) = try makeStore()
        let flight = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        context.insert(flight)
        let start = Date(timeIntervalSince1970: 1_710_520_200) // 15/03/2024 16:30 UTC
        flight.scheduledDeparture = start
        flight.scheduledArrival = start.addingTimeInterval(750 * 60)
        #expect(flight.durationMinutes == 750)

        flight.actualDeparture = start.addingTimeInterval(20 * 60)
        flight.actualArrival = start.addingTimeInterval(760 * 60)
        #expect(flight.durationMinutes == 740)

        flight.durationMinutesManual = 755
        #expect(flight.durationMinutes == 755)
    }

    @Test func enumsRoundTripThroughRawStrings() throws {
        let (_, context) = try makeStore()
        let flight = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        context.insert(flight)
        #expect(flight.cabinClass == .economy)
        flight.cabinClass = .business
        flight.seatPosition = .window
        #expect(flight.cabinClassRaw == "business")
        #expect(flight.seatPosition == .window)
        flight.cabinClassRaw = "desconocido"
        #expect(flight.cabinClass == .other)
    }

    @Test func photosAreDeletedWithTheirFlight() throws {
        let (_, context) = try makeStore()
        let flight = Flight(date: .now, originCode: "SCL", destinationCode: "MAD")
        context.insert(flight)
        let photo = FlightPhoto(imageData: Data([1, 2, 3]))
        context.insert(photo)
        photo.flight = flight
        try context.save()
        #expect(flight.photos?.count == 1)

        context.delete(flight)
        try context.save()
        #expect(try context.fetch(FetchDescriptor<FlightPhoto>()).isEmpty)
    }
}
