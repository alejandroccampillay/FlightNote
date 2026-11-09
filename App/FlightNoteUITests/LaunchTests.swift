import XCTest

final class LaunchTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Arranca la app, recorre las 5 pestañas y guarda una captura de cada una (en claro y en oscuro).
    /// El CI exporta las capturas como artefacto para revisar la UI sin Mac.
    @MainActor
    func testTabsAndCaptureScreenshots() throws {
        for (argument, label) in [("-ui-light", "claro"), ("-ui-dark", "oscuro")] {
            let app = XCUIApplication()
            app.launchArguments = ["-ui-testing", argument]
            app.launch()

            for name in ["Pasaporte", "Vuelos", "Mi flota", "Estadísticas", "Ajustes"] {
                let tab = tabButton(named: name, in: app)
                XCTAssertTrue(tab.waitForExistence(timeout: 15), "Falta la pestaña \(name)")
                tab.tap()
                attachScreenshot(of: app, name: "\(label)-\(name)")
            }

            // Ajustes debe mostrar la base de referencia cargada (y no el mensaje de error).
            let airports = app.descendants(matching: .any)["reference-airport-count"]
            XCTAssertTrue(airports.waitForExistence(timeout: 5), "La base de referencia no se cargó")
            XCTAssertFalse(app.descendants(matching: .any)["reference-error"].exists)
            app.terminate()
        }
    }

    private func tabButton(named name: String, in app: XCUIApplication) -> XCUIElement {
        let inTabBar = app.tabBars.buttons[name]
        return inTabBar.exists ? inTabBar : app.buttons[name].firstMatch
    }

    private func attachScreenshot(of app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
