import FNReferenceData
import SwiftUI

enum AppTab: Hashable {
    case passport, flights, fleet, stats, settings
}

struct RootView: View {
    let reference: ReferenceDatabase?
    @State private var selection: AppTab = .passport

    var body: some View {
        TabView(selection: $selection) {
            Tab("Pasaporte", systemImage: "globe.americas.fill", value: AppTab.passport) {
                PlaceholderScreen(
                    title: "Pasaporte",
                    emptyTitle: "Tu pasaporte está en blanco",
                    systemImage: "globe.americas",
                    message: "Cuando registres vuelos, aquí verás tus rutas, países y kilómetros."
                )
            }
            Tab("Vuelos", systemImage: "airplane", value: AppTab.flights) {
                PlaceholderScreen(
                    title: "Vuelos",
                    emptyTitle: "Aún no hay vuelos",
                    systemImage: "airplane.departure",
                    message: "Registra tu primer vuelo, aunque sea de hace muchos años."
                )
            }
            Tab("Mi flota", systemImage: "airplane.circle", value: AppTab.fleet) {
                PlaceholderScreen(
                    title: "Mi flota",
                    emptyTitle: "Tu flota está vacía",
                    systemImage: "airplane.circle",
                    message: "Cada matrícula que vueles tendrá aquí su propia ficha."
                )
            }
            Tab("Estadísticas", systemImage: "chart.bar.xaxis", value: AppTab.stats) {
                PlaceholderScreen(
                    title: "Estadísticas",
                    emptyTitle: "Sin estadísticas todavía",
                    systemImage: "chart.bar",
                    message: "Récords, rankings y logros se calcularán con tu historial."
                )
            }
            Tab("Ajustes", systemImage: "gearshape", value: AppTab.settings) {
                SettingsView(reference: reference)
            }
        }
    }
}

/// Pantalla provisional de la Fase 1 hasta implementar cada sección.
struct PlaceholderScreen: View {
    let title: String
    let emptyTitle: String
    let systemImage: String
    let message: String

    var body: some View {
        NavigationStack {
            ContentUnavailableView {
                Label(emptyTitle, systemImage: systemImage)
            } description: {
                Text(message)
            }
            .navigationTitle(title)
        }
    }
}

#Preview {
    RootView(reference: try? ReferenceDatabase.bundled())
}
