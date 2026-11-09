import Foundation
import Testing
@testable import FNDomain

struct GreatCircleTests {
    let scl = GeoCoordinate(latitude: -33.393001556396484, longitude: -70.78579711914062)
    let mad = GeoCoordinate(latitude: 40.493407, longitude: -3.572249)
    let jfk = GeoCoordinate(latitude: 40.639447, longitude: -73.779317)
    let lhr = GeoCoordinate(latitude: 51.470748, longitude: -0.459909)
    let syd = GeoCoordinate(latitude: -33.946098, longitude: 151.177002)
    let akl = GeoCoordinate(latitude: -37.01199, longitude: 174.786331)

    @Test func knownRouteDistances() {
        // Valores de referencia: haversine con R = 6371,0088 km (calculado de forma independiente en Python).
        #expect(abs(GreatCircle.distanceKm(from: scl, to: mad) - 10_719.3) < 1)
        #expect(abs(GreatCircle.distanceKm(from: jfk, to: lhr) - 5_539.8) < 1)
        #expect(abs(GreatCircle.distanceKm(from: syd, to: akl) - 2_159.1) < 1)
    }

    @Test func distanceIsSymmetricAndZeroForSamePoint() {
        #expect(abs(GreatCircle.distanceKm(from: mad, to: scl) - GreatCircle.distanceKm(from: scl, to: mad)) < 1e-9)
        #expect(GreatCircle.distanceKm(from: mad, to: mad) == 0)
    }

    @Test func intermediatePointsIncludeEndpointsAndCrossDateLine() {
        let points = GreatCircle.intermediatePoints(from: syd, to: akl, count: 32)
        #expect(points.count == 32)
        #expect(abs(points.first!.latitude - syd.latitude) < 1e-6)
        #expect(abs(points.last!.longitude - akl.longitude) < 1e-6)

        // La ruta JFK→LHR sube hacia el norte: el punto medio queda por encima de ambos extremos.
        let mid = GreatCircle.intermediatePoints(from: jfk, to: lhr, count: 3)[1]
        #expect(mid.latitude > lhr.latitude)
    }

    @Test func degeneratePointsReturnEndpoints() {
        #expect(GreatCircle.intermediatePoints(from: mad, to: mad, count: 10) == [mad, mad])
    }

    @Test func unitConversion() {
        #expect(abs(DistanceUnit.miles.convert(km: 1.609344) - 1) < 1e-12)
        #expect(abs(DistanceUnit.nauticalMiles.convert(km: 1.852) - 1) < 1e-12)
        #expect(DistanceUnit.kilometers.convert(km: 42) == 42)
    }
}
