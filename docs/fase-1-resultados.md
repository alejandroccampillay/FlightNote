# Fase 1 — Cimientos: resultados

**Fecha:** 2026-11-08

## Implementado

| Pieza | Ubicación | Estado |
|---|---|---|
| Repositorio git, `.gitignore`, README | raíz | ✅ |
| Base de referencia: 6.116 aeropuertos, 6.141 aerolíneas, 110 tipos y 165 prefijos de matrícula (1,8 MB) | `Tools/reference-data/`, `…/FNReferenceData/Resources/reference.sqlite` | ✅ Generada y verificada en local con Python |
| Dominio: distancia ortodrómica, arcos, unidades, matrículas, país por prefijo, horas locales, duración, normalización de búsqueda | `Packages/FlightNoteKit/Sources/FNDomain` | ⏳ Pendiente de compilar en CI |
| Acceso a la base de referencia (búsqueda y consultas por código) | `…/Sources/FNReferenceData` | ⏳ Pendiente de compilar en CI |
| Modelo SwiftData v1 (Flight, Aircraft, FlightPhoto), plan de migraciones y `AircraftRegistry` (sin duplicados + fusión) | `…/Sources/FNPersistence` | ⏳ Pendiente de compilar en CI |
| Tests: unos 40 casos con Swift Testing | `Packages/FlightNoteKit/Tests` | ⏳ Pendiente de ejecutar en CI |
| App esqueleto: 5 pestañas con estados vacíos y Ajustes con los datos de la base | `App/FlightNote` | ⏳ Pendiente de compilar en CI |
| Test de UI que recorre las pestañas y guarda capturas en claro y oscuro | `App/FlightNoteUITests` | ⏳ Pendiente de ejecutar en CI |
| Proyecto XcodeGen | `project.yml` | ✅ YAML válido |
| CI: tests del paquete, tests de UI, capturas, `.ipa` sin firmar | `.github/workflows/ci.yml` | ✅ YAML válido · ⏳ sin ejecutar |

## Verificado en local (Windows)

- El script de la base de referencia se ejecuta de principio a fin.
- Los datos de prueba son correctos:
  - SCL → America/Santiago, MAD → Europe/Madrid.
  - "LA" → LATAM Airlines, "JA" → JetSMART.
  - La búsqueda "barajas" → MAD.
- Las distancias que esperan los tests (SCL–MAD 10.719,3 km; JFK–LHR 5.539,8 km; SYD–AKL 2.159,1 km) están calculadas de forma independiente en Python.
- Las consultas SQL de los tests de `FNReferenceData` dan el resultado esperado.

## No verificado todavía

**Ningún código Swift se ha compilado aún**: no hay toolchain Swift en este equipo. La Fase 1 se dará por cerrada cuando el CI esté en verde. Lo previsible es que la primera ejecución saque algún error de compilación menor que habrá que corregir.

## Cómo ejecutar el CI

1. Crea un repositorio vacío en GitHub (público para tener minutos de macOS gratis).
2. Conecta el repositorio local y haz push:

   ```bash
   git remote add origin https://github.com/<usuario>/FlightNote.git
   ```

   ```bash
   git push -u origin main
   ```

3. En la pestaña **Actions** aparece la ejecución **CI**. Al terminar, la sección *Artifacts* tiene:
   - `screenshots`: capturas de las 5 pestañas en claro y oscuro;
   - `FlightNote-unsigned-ipa`: la app para instalar por sideloading;
   - `test-results` (solo si algo falla).

## Limitaciones conocidas (registro)

| # | Limitación | Plan |
|---|---|---|
| L1 | Sin Mac: la compilación solo es posible en CI | Aceptado (ADR 0001) |
| L2 | Sin cuenta de desarrollador: no hay TestFlight ni iCloud | Aceptado (ADR 0001) |
| L3 | Las aerolíneas de OpenFlights están desactualizadas | Correcciones en `airline_overrides.json`; siempre se puede escribir a mano |
| L4 | Si el almacén del usuario no se puede abrir, la app se cierra (`fatalError`) | Pantalla de recuperación en la Fase 8 |
| L5 | La lista de tipos de aeronave no es exhaustiva (110 tipos) | Ampliar en la Fase 6 |
| L6 | No hay icono de app | Fase 7 (diseño) |
