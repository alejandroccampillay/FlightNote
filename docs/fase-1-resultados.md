# Fase 1 — Cimientos (Expo): resultados

**Fecha:** 2026-11-09 · Ver [ADR 0003](adr/0003-cambio-a-expo.md) para el cambio de Swift a Expo.

## Implementado y verificado

| Pieza | Ubicación | Verificación |
|---|---|---|
| Proyecto Expo SDK 58 con Expo Router y 5 pestañas nativas | `src/app/` | `tsc` ✅ · `expo lint` ✅ · bundle iOS exportado ✅ · `expo-doctor` 20/20 ✅ |
| Dominio: distancias, arcos, unidades, matrículas, país por prefijo, horas locales, duración, búsqueda | `src/domain/` | 12 tests ✅ |
| Base de referencia: 6.116 aeropuertos, 6.141 aerolíneas, 110 tipos, 165 prefijos | `assets/data/reference.sqlite`, `src/data/referenceRepository.ts` | 6 tests contra la base real ✅ · incluida en el bundle ✅ |
| Datos del usuario: esquema v1, migraciones, vuelos y aeronaves sin duplicados, fusión, edición sin perder fotos | `src/data/userSchema.ts`, `src/data/userRepository.ts` | 7 tests ✅ (incluye el ejemplo LA800 SCL→MAD con CC-BGG) |
| Apertura de ambas bases al arrancar | `src/data/DataProvider.tsx` | ⏳ Pendiente de probar en el iPhone |
| Pantallas: Pasaporte (totales), Vuelos (lista), Mi flota (fichas), Estadísticas (vacía), Ajustes (base de referencia, recuento y botón "vuelo de ejemplo") | `src/app/*.tsx` | ⏳ Pendiente de probar en el iPhone |
| CI en GitHub Actions | `.github/workflows/ci.yml` | ⏳ Se ejecutará con el próximo push |

**Total: 25 tests en verde en local** (`npm test`).

## Cómo probarla en el iPhone

1. Instala **Expo Go** desde la App Store.
2. En el PC, dentro de la carpeta del proyecto:

   ```bash
   npm install
   ```

   ```bash
   npx expo start
   ```

3. Escanea con la **cámara del iPhone** el código QR que aparece en la terminal. Se abrirá en Expo Go.
4. El iPhone y el PC tienen que estar en la **misma Wi-Fi**. Si Windows pregunta por el firewall para Node.js, permite el acceso en redes privadas. Si aun así no conecta:

   ```bash
   npx expo start --tunnel
   ```

5. Prueba de punta a punta:
   - Ajustes → **"Añadir vuelo de ejemplo (LA800)"**.
   - Después, Vuelos, Mi flota y Pasaporte deben mostrar el vuelo SCL→MAD de 10.719 km y la ficha CC-BGG.

## Limitaciones conocidas

| # | Limitación | Plan |
|---|---|---|
| L1 | No hay formulario de alta de vuelos (solo el vuelo de ejemplo) | Fase 2 |
| L2 | Sin cuenta de Apple: no hay app independiente ni App Store; se usa Expo Go | Al tener cuenta: EAS Build |
| L3 | Las aerolíneas de OpenFlights están desactualizadas | `airline_overrides.json`; siempre se puede escribir a mano |
| L4 | Las copias antiguas de la base de referencia no se borran al actualizar | Limpieza en una fase posterior |
| L5 | Hay iconos y una pantalla de inicio provisionales (los de la plantilla de Expo) | Fase 7 (diseño) |
| L6 | No hay sincronización con iCloud | Exportación y copias de seguridad en la Fase 8 |
