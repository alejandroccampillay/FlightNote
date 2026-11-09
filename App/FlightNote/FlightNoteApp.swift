import FNPersistence
import FNReferenceData
import SwiftData
import SwiftUI

@main
struct FlightNoteApp: App {
    private let container: ModelContainer
    private let reference: ReferenceDatabase?

    init() {
        // Las pruebas de UI arrancan con un almacén vacío en memoria.
        let isUITesting = ProcessInfo.processInfo.arguments.contains("-ui-testing")
        do {
            container = try PersistenceController.makeContainer(inMemory: isUITesting)
        } catch {
            // TODO(Fase 8): pantalla de recuperación con exportación de emergencia en lugar de cerrar.
            fatalError("No se pudo abrir la base de datos del usuario: \(error)")
        }
        reference = try? ReferenceDatabase.bundled()
    }

    /// Solo para pruebas de UI: `-ui-dark` / `-ui-light` fuerzan la apariencia.
    private static var forcedColorScheme: ColorScheme? {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-ui-dark") { return .dark }
        if arguments.contains("-ui-light") { return .light }
        return nil
    }

    var body: some Scene {
        WindowGroup {
            RootView(reference: reference)
                .preferredColorScheme(Self.forcedColorScheme)
        }
        .modelContainer(container)
    }
}
