# FlightNote

Pasaporte aeronáutico personal para iPhone. Registra todos los vuelos comerciales de tu vida y construye tu propia colección de aeronaves por matrícula. Funciona sin conexión y sin cuenta, y no tiene publicidad ni suscripciones.

> Proyecto independiente inspirado funcionalmente en [Flown](https://flown-app.com/). No contiene código, diseño ni recursos de Flown.

## Estado

**Fase 1: cimientos.** Incluye el modelo de datos, la base de referencia, el dominio con sus tests, el esqueleto de la app y el CI. Ver [docs/](docs/).

## Estructura

```
App/                      App iOS (SwiftUI) y tests de UI
Packages/FlightNoteKit/   Módulos Swift (SPM)
  FNDomain                Lógica pura: geodesia, matrículas, horarios. Sin dependencias.
  FNReferenceData         Base aeronáutica SQLite de solo lectura (aeropuertos, aerolíneas, tipos, prefijos)
  FNPersistence           Datos del usuario con SwiftData (vuelos, aeronaves, fotos)
Tools/reference-data/     Script que genera la base de referencia a partir de fuentes públicas
project.yml               Definición del proyecto Xcode (XcodeGen)
.github/workflows/ci.yml  Compilación, tests, capturas e .ipa sin firmar en macOS
docs/                     Investigación, ADR y documentación
```

## Compilar

### Con un Mac

Requisitos: Xcode 16 o superior y [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
brew install xcodegen
```

```bash
xcodegen generate
```

```bash
open FlightNote.xcodeproj
```

Para pasar los tests del paquete sin Xcode:

```bash
cd Packages/FlightNoteKit && swift test
```

### Sin Mac (CI)

Cada push a GitHub ejecuta `.github/workflows/ci.yml` en macOS, que:

1. pasa los tests del paquete;
2. genera el proyecto Xcode;
3. pasa los tests de la app en el simulador;
4. exporta capturas de pantalla;
5. genera `FlightNote-unsigned.ipa`.

Los resultados se descargan desde la pestaña **Actions** del repositorio, en el apartado *Artifacts*.

## Regenerar la base de referencia

```bash
python Tools/reference-data/build_reference_db.py
```

El script descarga los datos públicos y escribe `Packages/FlightNoteKit/Sources/FNReferenceData/Resources/reference.sqlite`. Ver [Tools/reference-data/README.md](Tools/reference-data/README.md).

## Licencias de datos

- **Aeropuertos y países:** [OurAirports](https://ourairports.com/data/), dominio público.
- **Aerolíneas:** [OpenFlights](https://openflights.org/data), Open Database License (ODbL).
- **Zonas horarias:** calculadas a partir de coordenadas con `timezonefinder` (datos de timezone-boundary-builder, ODbL).
- **Tipos de aeronave y prefijos de matrícula:** lista propia (`Tools/reference-data/*.json`).
