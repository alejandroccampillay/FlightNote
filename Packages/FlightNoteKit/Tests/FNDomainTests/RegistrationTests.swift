import Testing
@testable import FNDomain

struct RegistrationTests {
    @Test(arguments: [
        ("CC-BGG", "CCBGG"), ("cc-bgg", "CCBGG"), (" CC BGG ", "CCBGG"), ("N12345", "N12345"),
        ("ja-8089", "JA8089"), ("EC–MIG", "ECMIG"), ("", ""),
    ])
    func normalizedKey(raw: String, expected: String) {
        #expect(Registration.normalizedKey(raw) == expected)
    }

    @Test func displayFormKeepsHyphens() {
        #expect(Registration.displayForm(" cc-bgg ") == "CC-BGG")
        #expect(Registration.displayForm("hb jcm") == "HBJCM")
    }

    static let resolver = RegistrationCountryResolver(prefixes: [
        .init(prefix: "C-", countryISO: "CA"),
        .init(prefix: "CC-", countryISO: "CL"),
        .init(prefix: "N", countryISO: "US"),
        .init(prefix: "B-", countryISO: "CN"),
        .init(prefix: "B-H", countryISO: "HK"),
        .init(prefix: "VP-B", countryISO: "BM"),
        .init(prefix: "JA", countryISO: "JP"),
        .init(prefix: "EC-", countryISO: "ES"),
        .init(prefix: "Z-", countryISO: "ZW"),
        .init(prefix: "ZS-", countryISO: "ZA"),
    ])

    @Test(arguments: [
        ("CC-BGG", "CL"), ("CCBGG", "CL"), ("C-FIUA", "CA"), ("CFIUA", "CA"),
        ("N787AL", "US"), ("B-HNR", "HK"), ("B-1234", "CN"), ("VP-BGA", "BM"),
        ("JA8089", "JP"), ("ec-mig", "ES"), ("ZS-SNA", "ZA"), ("Z-WPF", "ZW"),
    ])
    func countryFromPrefix(registration: String, expected: String) {
        #expect(Self.resolver.countryISO(for: registration) == expected)
    }

    @Test func unknownPrefixReturnsNil() {
        #expect(Self.resolver.countryISO(for: "XX-123") == nil)
        #expect(Self.resolver.countryISO(for: "   ") == nil)
    }
}
