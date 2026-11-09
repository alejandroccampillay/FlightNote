import Foundation
import Testing
@testable import FNDomain

struct FlightTimingTests {
    let santiago = TimeZone(identifier: "America/Santiago")!
    let madrid = TimeZone(identifier: "Europe/Madrid")!
    let auckland = TimeZone(identifier: "Pacific/Auckland")!
    let losAngeles = TimeZone(identifier: "America/Los_Angeles")!

    @Test func overnightFlightAcrossTimeZones() {
        // SCL 15/03/2024 13:30 (UTC−3, horario de verano chileno) → MAD 16/03/2024 06:00 (UTC+1).
        let minutes = FlightTiming.durationMinutes(
            departure: LocalDateTime(year: 2024, month: 3, day: 15, hour: 13, minute: 30), departureZone: santiago,
            arrival: LocalDateTime(year: 2024, month: 3, day: 16, hour: 6, minute: 0), arrivalZone: madrid
        )
        #expect(minutes == 750)
    }

    @Test func eastboundAcrossDateLineArrivesEarlierLocalDate() {
        // AKL 10/01/2025 19:30 (UTC+13) → LAX 10/01/2025 10:30 (UTC−8): 12 h.
        let minutes = FlightTiming.durationMinutes(
            departure: LocalDateTime(year: 2025, month: 1, day: 10, hour: 19, minute: 30), departureZone: auckland,
            arrival: LocalDateTime(year: 2025, month: 1, day: 10, hour: 10, minute: 30), arrivalZone: losAngeles
        )
        #expect(minutes == 720)
    }

    @Test func implausibleDurationsAreRejected() {
        let t = LocalDateTime(year: 2024, month: 3, day: 15, hour: 13, minute: 30)
        #expect(FlightTiming.durationMinutes(departure: t, departureZone: madrid, arrival: t, arrivalZone: madrid) == nil)
        let twoDaysLater = LocalDateTime(year: 2024, month: 3, day: 17, hour: 13, minute: 30)
        #expect(FlightTiming.durationMinutes(departure: t, departureZone: madrid, arrival: twoDaysLater, arrivalZone: madrid) == nil)
    }

    @Test func localDateTimeRoundTrip() throws {
        let local = LocalDateTime(year: 1998, month: 7, day: 1, hour: 23, minute: 5)
        let date = try #require(local.date(in: santiago))
        #expect(LocalDateTime(date: date, timeZone: santiago) == local)
    }

    @Test func blockTimeEstimate() {
        #expect(FlightTiming.estimatedBlockMinutes(distanceKm: 0) == 0)
        #expect(FlightTiming.estimatedBlockMinutes(distanceKm: 800) == 90)
        #expect(FlightTiming.estimatedBlockMinutes(distanceKm: 10_719) % 5 == 0)
    }
}

struct SearchTextTests {
    @Test func foldRemovesCaseAndDiacritics() {
        #expect(SearchText.fold("Adolfo Suárez Madrid-Barajas") == "adolfo suarez madrid-barajas")
        #expect(SearchText.fold("ZÜRICH") == "zurich")
        #expect(SearchText.tokens("  Santiago,  Chile ") == ["santiago", "chile"])
    }
}
