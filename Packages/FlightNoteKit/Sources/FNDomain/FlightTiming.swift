import Foundation

/// Fecha y hora "de reloj" local de un aeropuerto, sin zona horaria asociada.
/// Es lo que aparece en una tarjeta de embarque: "15/03/2024 13:30".
public struct LocalDateTime: Hashable, Sendable, Codable {
    public var year: Int
    public var month: Int
    public var day: Int
    public var hour: Int
    public var minute: Int

    public init(year: Int, month: Int, day: Int, hour: Int = 0, minute: Int = 0) {
        self.year = year
        self.month = month
        self.day = day
        self.hour = hour
        self.minute = minute
    }

    /// Hora de reloj que muestra `timeZone` en el instante `date`.
    public init(date: Date, timeZone: TimeZone) {
        let c = Self.calendar(timeZone).dateComponents([.year, .month, .day, .hour, .minute], from: date)
        self.init(year: c.year ?? 1970, month: c.month ?? 1, day: c.day ?? 1, hour: c.hour ?? 0, minute: c.minute ?? 0)
    }

    /// Instante absoluto que corresponde a esta hora de reloj en `timeZone`.
    public func date(in timeZone: TimeZone) -> Date? {
        let components = DateComponents(year: year, month: month, day: day, hour: hour, minute: minute)
        return Self.calendar(timeZone).date(from: components)
    }

    private static func calendar(_ timeZone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar
    }
}

public enum FlightTiming {
    /// Duración máxima aceptada al calcular un vuelo (el más largo del mundo ronda las 19 h).
    public static let maximumMinutes = 24 * 60

    /// Duración en minutos entre la salida y la llegada, cada una en la hora local de su aeropuerto.
    /// Devuelve `nil` si el resultado no es plausible (negativo, cero o más de 24 h).
    public static func durationMinutes(
        departure: LocalDateTime, departureZone: TimeZone,
        arrival: LocalDateTime, arrivalZone: TimeZone
    ) -> Int? {
        guard let start = departure.date(in: departureZone),
              let end = arrival.date(in: arrivalZone) else { return nil }
        let minutes = Int((end.timeIntervalSince(start) / 60).rounded())
        guard minutes > 0, minutes <= maximumMinutes else { return nil }
        return minutes
    }

    /// Estimación aproximada del tiempo de bloque cuando no hay horas: 30 min de rodaje y maniobras
    /// más el tramo en crucero a 800 km/h, redondeado a 5 minutos.
    public static func estimatedBlockMinutes(distanceKm: Double) -> Int {
        guard distanceKm > 0 else { return 0 }
        let raw = 30 + distanceKm / 800 * 60
        return Int((raw / 5).rounded()) * 5
    }
}
