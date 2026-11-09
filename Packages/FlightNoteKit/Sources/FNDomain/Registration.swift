import Foundation

/// Utilidades para matrículas de aeronaves (p. ej., "CC-BGG", "N12345", "JA8089").
public enum Registration {
    /// Clave canónica para detectar duplicados: solo A–Z y 0–9, en mayúsculas.
    /// "cc-bgg", "CC BGG" y "CC-BGG" dan "CCBGG".
    public static func normalizedKey(_ raw: String) -> String {
        var out = ""
        for scalar in raw.uppercased().unicodeScalars
        where letters.contains(scalar) || digits.contains(scalar) {
            out.unicodeScalars.append(scalar)
        }
        return out
    }

    private static let letters: ClosedRange<Unicode.Scalar> = "A"..."Z"
    private static let digits: ClosedRange<Unicode.Scalar> = "0"..."9"

    /// Forma para mostrar: en mayúsculas, sin espacios, conservando los guiones que escribió el usuario.
    public static func displayForm(_ raw: String) -> String {
        raw.uppercased().filter { !$0.isWhitespace }
    }
}

/// Prefijo de nacionalidad OACI: "CC-" → Chile.
public struct RegistrationPrefix: Hashable, Sendable, Codable {
    public var prefix: String
    public var countryISO: String

    public init(prefix: String, countryISO: String) {
        self.prefix = prefix
        self.countryISO = countryISO
    }
}

/// Deduce el país de registro a partir de la matrícula.
public struct RegistrationCountryResolver: Sendable {
    private struct Entry: Sendable {
        let raw: String     // "CC-", "VP-B", "N"
        let key: String     // "CC",  "VPB",  "N"
        let country: String
    }

    private let byRaw: [Entry]
    private let byKey: [Entry]

    public init(prefixes: [RegistrationPrefix]) {
        let entries = prefixes.map {
            Entry(raw: $0.prefix.uppercased(), key: Registration.normalizedKey($0.prefix), country: $0.countryISO)
        }
        byRaw = entries.sorted { $0.raw.count > $1.raw.count }
        byKey = entries.filter { !$0.key.isEmpty }.sorted { $0.key.count > $1.key.count }
    }

    /// Código ISO del país, o `nil` si no se reconoce el prefijo.
    ///
    /// Si la matrícula lleva guion, se compara con los prefijos tal cual ("B-H" → Hong Kong, frente a "B-" → China).
    /// Sin guion, se usa el prefijo más largo que encaje ("CCBGG" → "CC" Chile, no "C" Canadá).
    public func countryISO(for registration: String) -> String? {
        let display = Registration.displayForm(registration)
        guard !display.isEmpty else { return nil }
        if display.contains("-") {
            return byRaw.first { display.hasPrefix($0.raw) }?.country
        }
        let key = Registration.normalizedKey(display)
        return byKey.first { key.hasPrefix($0.key) }?.country
    }
}
