# ADR 0001 — Decisiones iniciales del proyecto

- **Fecha:** 2026-11-08
- **Estado:** aceptada

## Contexto

FlightNote es una alternativa propia a Flown (flown-app.com): un pasaporte aeronáutico personal para iOS. Condiciones de partida:

- Se desarrolla desde un equipo Windows, sin Mac.
- No hay cuenta del Apple Developer Program.

## Decisiones

1. **Referencia funcional:** Flown de flown-app.com (Tom Kwiatkowski). No es la app homónima con suscripción de flownapp.co.uk.
2. **Stack técnico:**
   - Swift 6, SwiftUI, SwiftData, MapKit, Swift Charts.
   - GRDB para la base de referencia en SQLite.
   - Módulos con Swift Package Manager.
   - iOS 18 como versión mínima.
3. **Compilación:**
   - CI con GitHub Actions en macOS.
   - El proyecto Xcode se genera con XcodeGen a partir de `project.yml`.
   - Las capturas del simulador se publican como artefactos de CI para revisar la UI.
4. **Distribución:**
   - Sin cuenta de pago, se genera un `.ipa` sin firmar para sideloading con un Apple ID gratuito (caduca cada 7 días).
   - TestFlight, App Store e iCloud sync se aplazan hasta tener cuenta.
5. **Persistencia:**
   - Datos del usuario en SwiftData, diseñados para ser compatibles con CloudKit: relaciones opcionales, valores por defecto y sin `.unique`.
   - Base de referencia en un SQLite separado de solo lectura.
   - Deduplicación de matrículas en la lógica de la app mediante `registrationKey` normalizada.
6. **Alcance:**
   - Fuera del MVP: noticias de aviación.
   - Dentro del MVP, en fases posteriores al núcleo: millas y puntos, extracción de reservas pegadas y autocompletar por número de vuelo con la API key del usuario.
7. **Identidad visual propia:** no se reutilizan la paleta azul marino/ámbar/cian, la tipografía Space Grotesk ni el panel de dígitos de Flown.

## Consecuencias

- Sin Mac, cada ciclo de compilación pasa por el CI, lo que hace la iteración más lenta. Por eso los tests del dominio deben ser exhaustivos.
- Sin la cuenta de pago no hay sincronización entre dispositivos. Los datos viven en el iPhone y en las copias de seguridad que exporte el usuario.
