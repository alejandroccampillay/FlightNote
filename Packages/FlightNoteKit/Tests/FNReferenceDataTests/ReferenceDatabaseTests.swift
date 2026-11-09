import FNDomain
import Testing
@testable import FNReferenceData

struct ReferenceDatabaseTests {
    let db: ReferenceDatabase

    init() throws {
        db = try ReferenceDatabase.bundled()
    }

    @Test func statisticsAreReasonable() throws {
        let stats = try db.statistics()
        #expect(stats.airports > 5_000)
        #expect(stats.airlines > 1_000)
        #expect(stats.aircraftTypes > 100)
        #expect(stats.schemaVersion == 1)
    }

    @Test func airportByIATAAndICAO() throws {
        let scl = try #require(try db.airport(code: "scl"))
        #expect(scl.icao == "SCEL")
        #expect(scl.countryISO == "CL")
        #expect(scl.continent == "SA")
        #expect(scl.timeZoneID == "America/Santiago")
        #expect(scl.timeZone != nil)

        let mad = try #require(try db.airport(code: "LEMD"))
        #expect(mad.iata == "MAD")
    }

    @Test func airportSearchByNameIgnoresAccents() throws {
        let results = try db.searchAirports("barajas", limit: 5)
        #expect(results.first?.iata == "MAD")

        let santiago = try db.searchAirports("Santiago merino", limit: 5)
        #expect(santiago.contains { $0.iata == "SCL" })
    }

    @Test func exactCodeRanksFirst() throws {
        let results = try db.searchAirports("ZRH", limit: 5)
        #expect(results.first?.iata == "ZRH")
    }

    @Test func likeWildcardsAreEscaped() throws {
        #expect(ReferenceDatabase.escapeLike("a%b_c\\d") == "a\\%b\\_c\\\\d")
        // Sin escapar, "%" devolvería todos los aeropuertos.
        #expect(try db.searchAirports("%", limit: 5).isEmpty)
        #expect(try db.searchAirports("", limit: 5).isEmpty)
    }

    @Test func airlinesPreferActiveAndCorrectedNames() throws {
        #expect(try db.airline(code: "LA")?.name == "LATAM Airlines")
        #expect(try db.airline(code: "JA")?.name == "JetSMART")
        #expect(try db.airline(code: "IBE")?.iata == "IB")
        #expect(try db.airline(code: "X") == nil)
        #expect(try db.searchAirlines("iberia", limit: 5).contains { $0.icao == "IBE" })
    }

    @Test func aircraftTypes() throws {
        let b789 = try #require(try db.aircraftType(icao: "b789"))
        #expect(b789.manufacturer == "Boeing")
        #expect(b789.variant == "787-9")
        #expect(try db.searchAircraftTypes("787", limit: 10).count == 3)
    }

    @Test func registrationPrefixesResolveRealCases() throws {
        let resolver = RegistrationCountryResolver(prefixes: try db.registrationPrefixes())
        #expect(resolver.countryISO(for: "CC-BGG") == "CL")
        #expect(resolver.countryISO(for: "HB-JCM") == "CH")
        #expect(resolver.countryISO(for: "A7-BHA") == "QA")
        #expect(resolver.countryISO(for: "TF-ICU") == "IS")
        #expect(resolver.countryISO(for: "N787AL") == "US")
        #expect(resolver.countryISO(for: "EC-MIG") == "ES")
    }
}
