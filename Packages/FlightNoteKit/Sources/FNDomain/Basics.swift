import Foundation

/// Clase de viaje.
public enum CabinClass: String, CaseIterable, Sendable, Codable {
    case economy
    case premiumEconomy
    case business
    case first
    case other
}

/// Posición del asiento.
public enum SeatPosition: String, CaseIterable, Sendable, Codable {
    case window
    case middle
    case aisle
}

/// Motivo del viaje.
public enum TravelReason: String, CaseIterable, Sendable, Codable {
    case leisure
    case business
    case crew
    case other
}

/// Normalización de texto para búsquedas. Debe coincidir con `fold()` en
/// Tools/reference-data/build_reference_db.py.
public enum SearchText {
    /// Minúsculas y sin diacríticos: "Barajas Adolfo Suárez" → "barajas adolfo suarez".
    public static func fold(_ text: String) -> String {
        text.folding(options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive], locale: nil)
            .lowercased()
    }

    /// Palabras de búsqueda ya normalizadas.
    public static func tokens(_ query: String) -> [String] {
        fold(query).split(whereSeparator: { $0.isWhitespace || $0 == "," }).map(String.init)
    }
}
