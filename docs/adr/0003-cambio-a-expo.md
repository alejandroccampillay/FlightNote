# ADR 0003 — Cambio de Swift nativo a Expo (React Native)

- **Fecha:** 2026-11-09
- **Estado:** aceptada. Sustituye a las partes de stack técnico de los ADR 0001 y 0002.

## Contexto

- El usuario usa iPhone a diario, pero desarrolla en Windows, sin Mac y sin cuenta de Apple Developer.
- Con Swift, cada prueba pasaba por un CI en macOS (15–30 min) y por sideloading con caducidad de 7 días.
- La primera ejecución del CI Swift compiló y pasó los tests del paquete. Los tests de UI fallaron. Ese código queda archivado en la rama `archivo/swift-ios`.

## Decisión

FlightNote se desarrolla con **Expo SDK 58** (React Native 0.88, TypeScript, Expo Router).

- **Desarrollo y pruebas en el iPhone del usuario con Expo Go**, sin Mac ni cuenta de pago.
- Android como plataforma adicional, sin coste extra.
- La distribución en la App Store se hará más adelante con EAS Build en la nube y una cuenta de Apple Developer.

## Detalles técnicos

| Aspecto | Decisión |
|---|---|
| Navegación | Expo Router con `NativeTabs` (`expo-router/native-tabs`): pestañas nativas de iOS |
| Datos del usuario | `expo-sqlite`, base `flightnote.db`. Migraciones con `PRAGMA user_version`. Clave única real en `aircraft.registration_key` |
| Base de referencia | `assets/data/reference.sqlite` (la genera el script Python). Se copia al dispositivo con `importDatabaseFromAssetAsync`, con un nombre de fichero versionado (`referenceVersion.generated.ts`) para que cada actualización instale la base nueva |
| Dominio y datos | TypeScript puro en `src/domain` y `src/data`, sin dependencias de React Native. Interfaz `SqlExecutor`, que expo-sqlite cumple tal cual |
| Tests | `node --test` con el soporte nativo de TypeScript de Node 24 y `node:sqlite`: sin dependencias de test, y se ejecutan en Windows. Requiere sintaxis TS "borrable" (sin `enum` ni propiedades de parámetro) e imports con extensión `.ts` en `src/domain` y `src/data` |
| Horas | Horas "de reloj" locales (`YYYY-MM-DDTHH:mm`) más la zona horaria del aeropuerto. El instante absoluto se calcula con `Intl` (Hermes lo soporta) |
| IDs | `expo-crypto.randomUUID` |
| CI | GitHub Actions en Ubuntu: `tsc`, `expo lint`, tests y `expo export --platform ios` |

## Riesgos y consecuencias

- `importDatabaseFromAssetAsync` está marcada como `@hidden` en expo-sqlite. Es lo que usa `<SQLiteProvider assetSource>` por dentro. Si desaparece en un SDK futuro, se sustituye por ese componente.
- Las copias antiguas de la base de referencia quedan en el dispositivo tras cada actualización (unos 2 MB cada una). Limpieza pendiente en una fase posterior.
- La sincronización con iCloud no está disponible. La propiedad de los datos se garantiza con exportación y copias de seguridad (Fase 8).
- Expo Go solo admite los módulos nativos que trae incluidos. Si una función necesita otro módulo, hará falta un *development build* (EAS).
