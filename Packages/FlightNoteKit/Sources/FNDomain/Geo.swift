import Foundation

/// Coordenada geográfica en grados decimales (WGS84).
public struct GeoCoordinate: Hashable, Sendable, Codable {
    public var latitude: Double
    public var longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

/// Cálculos sobre la esfera terrestre (ruta ortodrómica o de círculo máximo).
public enum GreatCircle {
    /// Radio medio terrestre (IUGG), en km.
    public static let earthRadiusKm = 6371.0088

    /// Distancia ortodrómica entre dos puntos, en km (fórmula del haversine).
    public static func distanceKm(from a: GeoCoordinate, to b: GeoCoordinate) -> Double {
        let lat1 = a.latitude.radians, lat2 = b.latitude.radians
        let dLat = (b.latitude - a.latitude).radians
        let dLon = (b.longitude - a.longitude).radians
        let h = sin(dLat / 2) * sin(dLat / 2) + cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2)
        return 2 * earthRadiusKm * asin(min(1, h.squareRoot()))
    }

    /// Puntos intermedios de la ruta ortodrómica, incluidos los extremos.
    /// Sirve para dibujar arcos en mapas que no los calculan solos.
    public static func intermediatePoints(from a: GeoCoordinate, to b: GeoCoordinate, count: Int) -> [GeoCoordinate] {
        let n = max(count, 2)
        let d = distanceKm(from: a, to: b) / earthRadiusKm // distancia angular
        let sinD = sin(d)
        // Puntos iguales o antipodales: la ruta no está definida de forma única.
        guard d > 1e-9, abs(sinD) > 1e-9 else { return [a, b] }

        let lat1 = a.latitude.radians, lon1 = a.longitude.radians
        let lat2 = b.latitude.radians, lon2 = b.longitude.radians
        return (0..<n).map { i in
            let f = Double(i) / Double(n - 1)
            let fa = sin((1 - f) * d) / sinD
            let fb = sin(f * d) / sinD
            let x = fa * cos(lat1) * cos(lon1) + fb * cos(lat2) * cos(lon2)
            let y = fa * cos(lat1) * sin(lon1) + fb * cos(lat2) * sin(lon2)
            let z = fa * sin(lat1) + fb * sin(lat2)
            let lat = atan2(z, (x * x + y * y).squareRoot())
            let lon = atan2(y, x)
            return GeoCoordinate(latitude: lat.degrees, longitude: lon.degrees)
        }
    }
}

/// Unidades de distancia que puede elegir el usuario.
public enum DistanceUnit: String, CaseIterable, Sendable, Codable {
    case kilometers, miles, nauticalMiles

    public func convert(km: Double) -> Double {
        switch self {
        case .kilometers: km
        case .miles: km / 1.609344
        case .nauticalMiles: km / 1.852
        }
    }
}

extension Double {
    var radians: Double { self * .pi / 180 }
    var degrees: Double { self * 180 / .pi }
}
