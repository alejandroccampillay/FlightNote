import FNReferenceData
import SwiftUI

struct SettingsView: View {
    let reference: ReferenceDatabase?

    private var statistics: ReferenceStatistics? {
        try? reference?.statistics()
    }

    private var appVersion: String {
        let info = Bundle.main.infoDictionary
        let version = info?["CFBundleShortVersionString"] as? String ?? "?"
        let build = info?["CFBundleVersion"] as? String ?? "?"
        return "\(version) (\(build))"
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Base de datos aeronáutica") {
                    if let statistics {
                        LabeledContent("Aeropuertos") {
                            Text(statistics.airports, format: .number)
                        }
                        .accessibilityIdentifier("reference-airport-count")
                        LabeledContent("Aerolíneas") {
                            Text(statistics.airlines, format: .number)
                        }
                        LabeledContent("Tipos de aeronave") {
                            Text(statistics.aircraftTypes, format: .number)
                        }
                        LabeledContent("Generada", value: statistics.builtAt)
                    } else {
                        Label("No se pudo abrir la base de referencia", systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.red)
                            .accessibilityIdentifier("reference-error")
                    }
                }

                Section {
                    Text("Aeropuertos y países: OurAirports (dominio público).")
                    Text("Aerolíneas: OpenFlights (Open Database License).")
                    Text("Zonas horarias: timezone-boundary-builder (Open Database License).")
                } header: {
                    Text("Licencias de datos")
                }
                .font(.footnote)

                Section("Acerca de") {
                    LabeledContent("Versión", value: appVersion)
                    Text("Tus datos se guardan solo en este iPhone. Sin cuenta, sin publicidad y sin seguimiento.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Ajustes")
        }
    }
}
