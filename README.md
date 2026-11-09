# FlightNote

Pasaporte aeronáutico personal para iPhone (y Android). Registra todos los vuelos comerciales de tu vida y construye tu propia colección de aeronaves por matrícula. Funciona sin conexión y sin cuenta, y no tiene publicidad ni suscripciones.

> Proyecto independiente inspirado funcionalmente en [Flown](https://flown-app.com/). No contiene código, diseño ni recursos de Flown.

## Estado

**Fase 1: cimientos (Expo).** Ver [docs/fase-1-resultados.md](docs/fase-1-resultados.md).

## Tecnología

Expo SDK 58 · React Native · TypeScript · Expo Router · expo-sqlite. Ver [ADR 0003](docs/adr/0003-cambio-a-expo.md).

La versión nativa en Swift quedó archivada en la rama `archivo/swift-ios`.

## Estructura

```
src/app/            Pantallas (Expo Router, pestañas nativas)
src/components/     Componentes de interfaz
src/domain/         Lógica pura: geodesia, matrículas, horarios, búsqueda (+ tests)
src/data/           SQLite: base de referencia, datos del usuario, migraciones (+ tests)
assets/data/        reference.sqlite (generada)
Tools/reference-data/  Script que genera la base de referencia a partir de fuentes públicas
docs/               Investigación, ADR y resultados por fase
```

## Desarrollo

```bash
npm install
```

```bash
npx expo start
```

Escanea el QR con la cámara del iPhone para abrir la app en **Expo Go** (misma Wi-Fi, o `npx expo start --tunnel`).

Comprobaciones:

```bash
npm run check
```

```bash
npx expo lint
```

`npm run check` ejecuta el typecheck y los tests (`node --test`; no necesita simulador).

## Regenerar la base de referencia

```bash
python -m pip install -r Tools/reference-data/requirements.txt
```

```bash
npm run build:reference
```

## Licencias de datos

- **Aeropuertos y países:** [OurAirports](https://ourairports.com/data/), dominio público.
- **Aerolíneas:** [OpenFlights](https://openflights.org/data), Open Database License (ODbL).
- **Zonas horarias:** `timezonefinder` (datos de timezone-boundary-builder, ODbL).
- **Tipos de aeronave y prefijos de matrícula:** listas propias (`Tools/reference-data/*.json`).
