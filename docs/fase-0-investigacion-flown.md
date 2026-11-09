# FlightNote — Fase 0: Investigación funcional de Flown

**Fecha:** 2026-11-08 · **Estado:** borrador para aprobación · **Nombre de trabajo del proyecto:** FlightNote

---

## 0. Alcance y método

Investigación realizada **solo con fuentes públicas**: sitio web oficial, política de privacidad publicada, ficha de App Store y Product Hunt. No se ha descompilado la app, interceptado tráfico ni accedido a servicios internos.

Fuentes consultadas:

| Fuente | Resultado |
|---|---|
| https://flown-app.com/ | Leída. Es la fuente principal. |
| https://flown-privacy.pages.dev (política, rev. 4-ago-2026) | Leída. |
| https://flown-privacy.pages.dev/donate.html | Leída. |
| https://apps.apple.com/app/id6785985193 (enlace "Download" de flown-app.com) | **Devuelve 404.** La ficha no está disponible públicamente ahora mismo (retirada, regional o cambiada). |
| https://apps.apple.com/us/app/flown-live-flights-trips/id6789278771 | Leída. **Es otra app distinta** (ver 0.1). |
| https://www.producthunt.com/products/flown | Leída. Corresponde a la otra app. |

### 0.1 Hallazgo importante: hay dos apps llamadas "Flown"

| | **Flown (flown-app.com)**: la que pediste | **Flown: Flight Tracker & Map** (flownapp.co.uk) |
|---|---|---|
| Autor | Tom Kwiatkowski, Suiza | Stefan Dupey-Whyte, Reino Unido |
| Modelo | Gratis, sin suscripción, sin anuncios, donaciones | Gratis + suscripción Pro (2,99 $/mes, 19,99 $/año) |
| Enfoque | Diario de vuelos personal | Diario + seguimiento en vivo + compensaciones UK261/EU261 |
| Idiomas | 10 (incluye árabe RTL, chino, turco) | Solo inglés |

✅ **Confirmado por el usuario (2026-11-08): la referencia es Flown de flown-app.com.** De la otra app solo tomo ideas útiles y gratuitas (pasaporte con sellos, mapa de países, "Wrapped" anual), marcadas como **[ref. B]**.

### 0.2 Limitaciones de esta auditoría (léelas)

- He analizado las **5 capturas oficiales** publicadas en flown-app.com (globo, logbook, mapa plano, estadísticas, detalle) y la hoja de estilos de la web (ver sección 2.1). **No he usado la app**: el formulario de alta, los ajustes, la pantalla de millas, la importación, los estados vacíos y las animaciones **no se ven en ninguna captura**.
- Para completar esas pantallas haría falta que **instales Flown y me pases capturas** de ellas. Es opcional: no bloquea la Fase 1.

---

## 1. Funcionalidades confirmadas (Flown, flown-app.com)

Leyenda: ✅ confirmado por la fuente · ❔ no mencionado (ni se confirma ni se descarta)

| Área | Funcionalidad | Estado |
|---|---|---|
| Registro | Alta manual: aeropuertos, aerolínea, aeronave, asiento, clase, notas | ✅ |
| Registro | Matrícula (registration) y tipo de aeronave | ✅ |
| Registro | Hasta 8 fotos por vuelo (se redimensionan automáticamente) | ✅ |
| Registro | Separación entre vuelos próximos y pasados | ✅ |
| Importación | Pegar el texto de una confirmación de reserva → se extrae el vuelo en el dispositivo | ✅ |
| Importación | Extracción con IA opcional usando una API key propia del usuario (Anthropic) | ✅ |
| Importación | CSV, escaneo de tarjeta de embarque, email, otras apps | ❔ |
| Historial | Lista tipo "logbook" con tarjetas estilo tarjeta de embarque | ✅ |
| Detalle | Ficha de vuelo con aeronave, matrícula, asiento, clase, notas y fotos | ✅ |
| Mapa | Globo 3D interactivo (girar/zoom) con rutas en círculo máximo | ✅ |
| Mapa | Mapa mundial plano alternativo | ✅ |
| Estadísticas | Total de vuelos, distancia, tiempo en el aire | ✅ |
| Estadísticas | Países, aeropuertos, aerolíneas, ruta más larga, aeronave más usada | ✅ |
| Fidelización | Programas de viajero frecuente: nombre, nº de socio, estatus, saldo | ✅ |
| Noticias | Feed de noticias de aviación (vía un proxy en Cloudflare, sin datos del usuario) | ✅ |
| Enlaces | Abre Flightradar24 / FlightAware / RadarBox / FlightStats en el navegador | ✅ |
| Ajustes | Idioma, aeropuerto base, unidades, tema, notificaciones | ✅ |
| Datos | Exportación JSON y CSV (Ajustes → Datos y copia de seguridad) | ✅ |
| Datos | Incluido en la copia de iCloud/iTunes del dispositivo | ✅ |
| Datos | Sincronización iCloud entre dispositivos | ❔ |
| Offline | Registro, mapas y estadísticas funcionan sin conexión | ✅ |
| Privacidad | Sin cuenta, sin analítica, sin crash reporting, fuentes tipográficas incluidas en la app | ✅ |
| Estadísticas | Contador de matrículas distintas ("Registrations") y de tipos de aeronave | ✅ (captura) |
| Detalle | Velocidad/altitud de crucero, block time; cuenta atrás de vuelos próximos | ✅ (captura) |
| Mapa | Filtro por año | ✅ (captura) |
| Logros / sellos / mapa de países / gráficos | | ❌ no aparecen en las capturas (sí en [ref. B]) |
| Colección de aeronaves por matrícula ("Mi flota") | | ❔ No hay una sección dedicada. Es **nuestro diferenciador**. |
| Widgets, Apple Watch, Siri, compartir | | ❔ (widgets/Siri/compartir sí en [ref. B]) |

---

## 2. Pantallas identificadas

Las de Flown (por pies de captura y textos), seguidas de las que propongo para FlightNote.

| # | Pantalla (Flown) | Contenido conocido |
|---|---|---|
| F1 | Globo 3D | Rutas como arcos geodésicos, interactivo |
| F2 | Logbook | Tarjetas tipo boarding pass, próximos vs pasados |
| F3 | Mapa plano | Rutas sobre mapa mundial |
| F4 | Estadísticas | Totales y rankings |
| F5 | Detalle de vuelo | Datos del vuelo, aeronave, fotos, notas, enlaces a trackers |
| F6 | Millas y puntos | Programas de fidelización |
| F7 | Noticias | Feed filtrado en el dispositivo |
| F8 | Ajustes | Idioma, base, unidades, tema, notificaciones, Datos y copia |
| F9 | Alta/edición de vuelo | Formulario + importar desde reserva |

### 2.1 Auditoría visual de las capturas oficiales

**Estructura general**

- **Barra de pestañas inferior con 5 elementos:** Flights · Map · Stats · Miles · **Log (+)**. Registrar un vuelo es una pestaña más, no un botón flotante.
- **Cabecera fija:** logotipo "FLOWN" (avión + letras espaciadas) a la izquierda. A la derecha, un icono de portapapeles (probablemente importar una reserva pegada) y un engranaje (Ajustes).
- **Tema oscuro único en las capturas:** fondo azul marino casi negro, tarjetas con un borde fino translúcido y esquinas redondeadas (~12 pt).

**Flights (logbook)**

- **Panel resumen "FLIGHT INFORMATION"** con estética de panel de salidas de aeropuerto: dígitos ámbar espaciados, en monoespaciada. Muestra Flights, Kilometres, Aircraft types y Countries.
- **Secciones:** "UPCOMING" (con una píldora de cuenta atrás, p. ej. "in 1 wk") y "FLOWN".
- **Tarjeta de vuelo con forma de tarjeta de embarque:**
  - Cuerpo principal:
    - Insignia con el código IATA de la aerolínea (no el logo) + nombre de la aerolínea + fecha.
    - Códigos IATA de origen y destino en grande, con la ciudad debajo.
    - En el centro, la distancia en km, un icono de avión y la duración.
    - Modelo de aeronave + **matrícula en un chip** (p. ej., "HB-JCM").
  - **Talón separado por una línea discontinua (perforación):** FLIGHT, CLASS y **SEAT en ámbar grande**.
  - Acciones en línea: Track / Flight data (despliega), Edit, Delete.
- **El "detalle" no es otra pantalla: es la tarjeta expandida.** Muestra:
  - una cuadrícula con velocidad de crucero (km/h), altitud de crucero (ft), block time y distancia (velocidad y altitud probablemente estimadas a partir del tipo de aeronave);
  - enlaces "TRACK" a FR24, FlightAware, RadarBox y FlightStats;
  - un botón "Load flight news".

**Map**

- **KPI en la parte superior:** airports, countries y km flown.
- **Chips de filtro por año:** All years, 2026, 2025… Es el único filtro visible.
- **Control segmentado Globe / Flat.**
- **Globo de dibujo propio** (no parece MapKit): esfera azul, contornos de países sutiles, arcos cian, aeropuertos como puntos ámbar y la indicación "Drag to spin". El mapa plano tiene la misma estética, en un recuadro.

**Stats**

- **Cuadrícula 2×4 de tarjetas con icono cian:** Total flights, Distance (con millas como subtítulo), Time in air, Airports, Countries, Airlines, **Registrations**, Photos.
- **Lista de récords:** Most flown aircraft, Most flown airline, Longest flight y Aircraft types collected.
- **No hay gráficos ni logros.**

**Paleta y tipografía**

Extraídas de la hoja de estilos de la web, que coincide con las capturas:

| Token | Color | Uso |
|---|---|---|
| `--navy` | #0F1730 | Fondo |
| `--navy-light` | #17213F | Tarjetas |
| `--runway` | #F5A623 | Acento ámbar: números, asiento, puntos |
| `--contrail` | #7DD3FC | Acento cian: rutas, iconos, chips |
| `--ink` | #EAF0FA | Texto |
| `--muted` | #8B96B8 | Texto secundario |

- Títulos en **Space Grotesk**.
- Códigos, números y matrículas en una **monoespaciada**.
- Etiquetas pequeñas en mayúsculas con letras espaciadas.

**Conclusiones para FlightNote**

- Flown ya cuenta las matrículas ("Registrations"), pero **no tiene una ficha por aeronave**. "Mi flota" sigue siendo nuestro diferenciador.
- Flown no tiene gráficos, logros ni filtros más allá del año: margen claro de mejora.
- **La paleta azul marino + ámbar + cian y el panel de dígitos son la identidad de Flown.** Para no copiarla, FlightNote usará otra paleta y otro tratamiento visual (ver sección 8), conservando solo las ideas genéricas: tarjeta tipo boarding pass, monoespaciada para códigos y arcos geodésicos.

### Pantallas propuestas para FlightNote

| # | Pantalla | Descripción |
|---|---|---|
| P1 | **Pasaporte** (inicio) | Globo/mapa con rutas, KPIs principales (vuelos, km, horas, países), filtros |
| P2 | **Vuelos** | Lista cronológica agrupada por año, buscador, tarjetas tipo boarding pass, próximos/pasados |
| P3 | Detalle de vuelo | Cabecera con la ruta, mini-mapa, datos, aeronave (enlace a su ficha), fotos, notas |
| P4 | Alta/edición de vuelo | Formulario por secciones con autocompletado de aeropuerto, aerolínea y matrícula |
| P5 | **Mi flota** | Cuadrícula de aeronaves por matrícula con foto, agrupable por modelo o aerolínea |
| P6 | Ficha de aeronave | Foto, datos, nº de vuelos, rutas, km acumulados, lista de vuelos |
| P7 | **Estadísticas** | Récords, rankings, gráficos por año (Swift Charts) |
| P8 | Logros | Insignias bloqueadas/desbloqueadas con progreso |
| P9 | Países / aeropuertos / aerolíneas | Listas navegables con su detalle (vuelos asociados) |
| P10 | **Ajustes** | Unidades, tema, iCloud, importar/exportar, copia/restauración, base de datos, acerca de |
| P11 | Importación CSV | Selector de archivo → mapeo de columnas → vista previa → resolución de conflictos |
| — | Estados vacíos | Uno por pantalla, con acción principal ("Registra tu primer vuelo") |

Quedan **fuera del alcance** (de momento): noticias, millas y puntos, seguimiento en vivo, compensaciones.

---

## 3. Estructura de navegación

```
TabView (5 pestañas)
├── Pasaporte ── Mapa/Globo ─┬─ Filtros (sheet)
│                            └─ Tocar ruta → Detalle de vuelo
├── Vuelos ───── Lista ──────┬─ [+] Alta de vuelo (sheet, multipaso)
│                            └─ Detalle de vuelo ─┬─ Editar (sheet)
│                                                 ├─ Ficha de aeronave
│                                                 ├─ Detalle de aeropuerto
│                                                 └─ Fotos (visor)
├── Mi flota ─── Cuadrícula ─── Ficha de aeronave ── Detalle de vuelo
├── Estadísticas ┬─ Récords → Detalle de vuelo
│                ├─ Países / Aeropuertos / Aerolíneas / Modelos → listas → vuelos
│                └─ Logros
└── Ajustes ─────┬─ Importar CSV / JSON
                 ├─ Exportar CSV / JSON
                 ├─ Copia de seguridad / Restaurar
                 ├─ iCloud (on/off)
                 └─ Acerca de / Licencias de datos
```

Un botón global "+" (en Vuelos y en Pasaporte) abre el alta de vuelo.

---

## 4. Modelo de datos propuesto

Dos almacenes **separados**:

1. **Datos del usuario** (SwiftData, sincronizable con iCloud): vuelos, aeronaves, fotos y ajustes.
2. **Base aeronáutica de referencia** (SQLite de solo lectura incluido en la app, actualizable con cada versión): aeropuertos, aerolíneas, tipos de aeronave y, opcionalmente, matrículas conocidas. No se sincroniza ni se mezcla con los datos del usuario.

### 4.1 Datos del usuario

```
Flight
  id: UUID
  date: Date (fecha local de salida)
  airlineCode: String?        // IATA/ICAO (referencia) …
  airlineName: String?        // … + texto libre si no existe en la base
  flightNumber: String?
  originCode / destinationCode: String   // IATA o ICAO
  originSnapshot / destinationSnapshot: AirportSnapshot  // nombre, país, lat/lon copiados al guardar
  scheduledDeparture / scheduledArrival: Date?   // con zona horaria del aeropuerto
  actualDeparture / actualArrival: Date?
  durationMinutes: Int?       // calculada o manual (manual tiene prioridad)
  distanceKm: Double          // círculo máximo, calculada
  cabinClass: enum (economy, premiumEconomy, business, first, other)
  seat, terminal, gate: String?
  seatType: enum? (ventana, pasillo, medio)
  reason: enum? (ocio, trabajo, …)
  notes: String?
  aircraft: Aircraft?         // relación N:1
  photos: [Photo]
  createdAt, updatedAt

Aircraft                      // una ficha por matrícula
  id: UUID
  registration: String        // como la introduce el usuario: "CC-BGG"
  registrationKey: String     // normalizada: "CCBGG" (mayúsculas, sin guiones/espacios) → deduplicación
  manufacturer, model, variant: String?   // Boeing / 787 / 787-9
  icaoType: String?           // B789
  name: String?               // nombre comercial ("Ciudad de …")
  operatorAirline: String?
  registrationCountry: String? // deducible del prefijo (CC- → Chile)
  photo: Photo?
  notes: String?
  flights: [Flight]           // inversa

Photo
  id: UUID
  data: Data (@Attribute(.externalStorage)), thumbnail: Data
  caption: String?, takenAt: Date?

UserSettings: unidades, tema, aeropuerto base, iCloud on/off
```

Los logros y las estadísticas **no se persisten**. Se calculan siempre a partir de los vuelos, así nunca se desincronizan.

### 4.2 Base de referencia (SQLite)

```
airport(ident, iata, icao, name, city, country_iso, continent, lat, lon, elevation_ft, tz, type)
airline(iata, icao, name, callsign, country_iso, active, brand_color?)
aircraft_type(icao_type, manufacturer, model, variant, family, engines)
country(iso, name_es, name_en, continent)
registration_prefix(prefix, country_iso)          // CC- → CL, EC- → ES, N → US …
known_registration(reg_key, icao_type, operator)   // opcional, ver 6
```

### 4.3 Decisiones clave del modelo

- **Deduplicación de matrículas.** iCloud (CloudKit) **no admite** restricciones `@Attribute(.unique)` en SwiftData. La unicidad se garantiza en la capa de lógica: antes de crear un `Aircraft` se busca por `registrationKey`. Además, un proceso de "fusionar duplicados" resuelve los que lleguen por sincronización y permite al usuario fusionar fichas a mano.
- **Snapshots de aeropuerto en el vuelo.** Si una actualización de la base cambia o elimina un aeropuerto, el historial no se rompe (requisito 10).
- **Zonas horarias.** La duración se calcula con la zona horaria de cada aeropuerto. Hace falta el campo `tz` en la base.
- **CloudKit exige** relaciones opcionales y valores por defecto en todos los atributos. El modelo se diseña así desde el día 1 para no tener que migrar después.

---

## 5. Funciones que podemos reproducir (gratis y offline)

| Función | Cómo |
|---|---|
| Registro / edición / borrado manual completo | SwiftUI + SwiftData |
| Autocompletado de aeropuertos y aerolíneas | Base SQLite incluida (OurAirports + OpenFlights), búsqueda FTS |
| Matrícula manual + país de registro por prefijo | Tabla de prefijos ICAO incluida |
| Mi flota sin duplicados | `registrationKey` + fusión |
| Distancia | Fórmula de círculo máximo (haversine/Vincenty) |
| Duración | Horas locales + zonas horarias de los aeropuertos |
| Mapa con rutas geodésicas reales | MapKit `MapPolyline(contourStyle: .geodesic)`. A poco zoom MapKit muestra un globo 3D |
| Mapa offline / "mapa de rasca" de países | Mapa vectorial propio con Natural Earth (dominio público) dibujado en SwiftUI `Canvas` |
| Estadísticas y gráficos | Cálculo local + Swift Charts |
| Logros | Reglas evaluadas sobre el historial |
| Pasaporte con sellos por país [ref. B] | Sellos generados (diseño propio) |
| Resumen anual compartible [ref. B] | `ImageRenderer` → imagen para compartir |
| Fotos | PhotosPicker / cámara, guardadas en local |
| Importación/exportación CSV y JSON, copia y restauración | Formato propio documentado + `fileImporter`/`fileExporter` |
| Extraer el vuelo pegando una confirmación de reserva | Heurísticas/regex en el dispositivo (sin IA) |
| Sincronización iCloud opcional | SwiftData + CloudKit (base privada del usuario, gratis) |
| Modo claro/oscuro, localización ES/EN | Nativo |

## 6. Funciones que requieren servicios externos

| Función | Opciones gratuitas | Limitaciones |
|---|---|---|
| Autocompletar vuelo por número + fecha | AeroDataBox (capa gratuita vía RapidAPI), AviationStack (100 peticiones/mes) | Cupos bajos, exigen API key y registro **del usuario**. Casi sin datos históricos de vuelos antiguos. **Propuesta: no incluirlo en el MVP**; más adelante, opcional con la key del propio usuario |
| Matrícula → tipo de aeronave | Base de aeronaves de OpenSky Network (descargable) | Cobertura parcial, **hay que verificar la licencia** antes de incluirla. Alternativa: que el usuario la importe. El dato manual siempre manda |
| Fotos de aeronaves por matrícula | API pública de Planespotters.net | Solo permite enlazar (hotlink) con atribución, no guardar copias → no funciona offline. **Por defecto, fotos propias del usuario** |
| Logotipos de aerolíneas | — | Son marcas registradas. **Propuesta: insignia propia** (código IATA + color) en lugar del logo |
| Tiles del mapa de MapKit | Gratis con la app | Necesita red (con caché limitada). Para offline, el mapa vectorial propio |
| Extracción de reservas con IA | API key propia del usuario | Opcional, fuera del MVP |

**Fuentes de la base de referencia**

- **OurAirports**: dominio público. Aeropuertos, países, continentes.
- **OpenFlights**: ODbL, exige atribución y compartir igual la base derivada. Aerolíneas y zonas horarias.
- **Natural Earth**: dominio público. Fronteras de países.

Las licencias se documentarán en Ajustes → Licencias.

---

## 7. Limitaciones técnicas

1. ⚠️ **Este equipo es Windows.** Una app iOS **solo se compila con Xcode en macOS**. Opciones:
   - a) un Mac propio (cualquier Mac con Apple Silicon y la versión actual de Xcode);
   - b) un Mac en la nube;
   - c) CI en macOS: GitHub Actions o Xcode Cloud (25 h/mes incluidas con la cuenta de desarrollador).

   Desde aquí puedo escribir todo el código, los tests y la configuración, pero **no compilar ni ejecutar el simulador**. La compilación y las pruebas tendrían que hacerse en el Mac o en CI.
2. ⚠️ **TestFlight y App Store exigen el Apple Developer Program (99 USD/año).** Es el único coste inevitable y choca con el requisito "sin servicios de pago". Sin esa cuenta, la app solo se puede instalar en tu iPhone desde Xcode con un Apple ID gratuito, y la firma caduca cada 7 días.
3. Sin una fuente gratuita de vuelos históricos, los vuelos antiguos se registran a mano (con autocompletado de aeropuertos y aerolíneas).
4. CloudKit no garantiza unicidad: hay que deduplicar en la app (ver 4.3).
5. SwiftData es mucho más estable a partir de iOS 18. **Propuesta: mínimo iOS 18** (cubre la gran mayoría de iPhones activos), compilando con el SDK actual.
6. El mapa de MapKit sin conexión depende de la caché del sistema. La vista offline garantizada será el mapa vectorial propio.
7. Base de aeropuertos: unos 80.000 registros completos. Filtrando los que tienen código IATA/ICAO y son de tipo comercial quedan unos 10.000, unos 2–4 MB. Se incluye completa en local.

---

## 8. Arquitectura recomendada

**Swift 6 · SwiftUI · SwiftData · MapKit · Swift Charts · GRDB** (SQLite de referencia, librería MIT) · **Swift Package Manager** con módulos locales. Sin dependencias de pago ni SDKs de terceros con telemetría.

```
FlightNote.xcodeproj (app delgada: composición, navegación, DI)
Packages/
├── FNDomain        Modelos de dominio puros, reglas: distancia, duración, logros, estadísticas.
│                   Sin dependencias de UI ni de persistencia → 100% testeable.
├── FNPersistence   SwiftData (@Model), repositorios, migraciones versionadas (VersionedSchema),
│                   deduplicación de aeronaves, sincronización CloudKit.
├── FNReferenceData SQLite de referencia (GRDB), búsqueda de aeropuertos/aerolíneas/tipos/prefijos.
├── FNProviders     Protocolos `AirportProvider`, `AircraftLookupProvider`, `FlightLookupProvider`…
│                   Implementación local por defecto; las remotas se enchufan sin tocar el núcleo.
├── FNMapping       Rutas geodésicas, mapa vectorial offline (Natural Earth), países visitados.
├── FNImportExport  CSV/JSON, mapeadores por formato (propio, OpenFlights, Flighty, myFlightradar24),
│                   copia/restauración (.flightnote = zip con JSON + fotos).
├── FNDesignSystem  Colores, tipografía, tarjetas, insignias, animaciones.
└── FNFeatures      Pantallas (Pasaporte, Vuelos, Flota, Estadísticas, Ajustes) con @Observable view models.
```

Principios:

- La UI solo depende de protocolos del dominio.
- Los proveedores de datos se registran en un `ProviderRegistry`: añadir una fuente nueva es añadir un módulo, no tocar el núcleo.
- Las migraciones de esquema son siempre explícitas, lo que garantiza no perder datos al actualizar.
- Las decisiones se registran como ADR en `docs/adr/`.

**Tests:** XCTest/Swift Testing para el dominio (distancias, duraciones, logros, deduplicación, parsers CSV), de persistencia con un store en memoria y de migraciones, y XCUITest para los flujos críticos (alta de vuelo, importación).

**Identidad visual propia (sin copiar Flown):** estética de "pasaporte/cartografía".

Flown usa azul marino + ámbar + cian, solo en oscuro (ver 2.1). FlightNote va en otra dirección:

- Modo claro con tonos papel/crema y modo oscuro en grafito, no azul marino.
- Un acento propio, por ejemplo verde pasaporte o rojo sello. Ni ámbar ni cian.
- SF Pro + SF Mono del sistema para códigos IATA y matrículas, en lugar de Space Grotesk.
- Tarjetas tipo billete diseñadas desde cero.
- Animación de trazado de ruta e insignias tipo sello de pasaporte.

El diseño detallado se aprobará en la Fase 7, antes de pulir la UI.

---

## 9. Plan de desarrollo por fases

Cada fase sigue el ciclo investigar → diseñar → implementar → compilar → probar → documentar → commit. No se avanza de fase si quedan errores críticos.

| Fase | Contenido | Entregable verificable |
|---|---|---|
| **0** | Esta auditoría + (opcional) auditoría visual con tus capturas | Este documento aprobado |
| **1** | Repo git, proyecto Xcode, paquetes SPM, modelo de datos, migraciones v1, base de referencia (script que genera el SQLite desde OurAirports/OpenFlights), CI macOS | Compila, tests del dominio en verde |
| **2** | Alta/edición/borrado de vuelos, autocompletado, cálculo de distancia/duración, lista de vuelos, detalle | Registrar el vuelo LA800 SCL→MAD (CC-BGG) de principio a fin |
| **3** | Mi flota: fichas por matrícula, deduplicación, fusión, fotos | Dos vuelos con CC-BGG → una sola ficha con 2 vuelos |
| **4** | Pasaporte: mapa/globo con rutas geodésicas, mapa offline de países, filtros (año, aerolínea, país, aeropuerto, modelo) | Rutas reales visibles y filtrables, también en modo avión |
| **5** | Estadísticas, récords, gráficos y logros automáticos | Logros recalculados al añadir o borrar vuelos (tests) |
| **6** | Ampliación de la base aeronáutica: tipos, prefijos, matrículas conocidas (si la licencia lo permite), arquitectura de proveedores | Autocompletado de matrícula offline |
| **7** | Sistema de diseño final, modo oscuro, animaciones, estados vacíos, accesibilidad (Dynamic Type, VoiceOver), localización ES/EN | Revisión visual pantalla a pantalla |
| **8** | Importación/exportación CSV y JSON, copia y restauración, formatos de terceros documentados | Ida y vuelta export → borrar → import sin pérdidas |
| **9** | iCloud opcional, rendimiento con más de 2.000 vuelos, documentación, TestFlight | Build en TestFlight + guía de instalación + registro de limitaciones |

---

## 10. Decisiones tomadas (2026-11-08)

| # | Decisión | Consecuencia |
|---|---|---|
| D1 | **Compilación en la nube** (sin Mac) | CI con GitHub Actions en macOS: compila, pasa los tests y genera capturas del simulador como artefactos para revisar la UI. Requiere un repositorio en GitHub. Si es **público**, los minutos de macOS son gratis. En uno privado, la cuota gratuita es muy limitada (hay que verificar la cuota actual). |
| D2 | **Sin Apple Developer Program por ahora** | No hay TestFlight, App Store ni iCloud sync (CloudKit necesita la cuenta de pago). El modelo sigue preparado para CloudKit y se activará cuando haya cuenta. Para probar en tu iPhone desde Windows, el CI genera un `.ipa` sin firmar que se instala con una herramienta de sideloading (p. ej., Sideloadly) y tu Apple ID gratuito. Caduca cada 7 días. Esas herramientas son de terceros: tú decides si las usas. |
| D3 | **iOS 18 mínimo** | SwiftData estable, `MapPolyline` geodésica, Swift Charts. |
| D4 | **Fuera del MVP: noticias de aviación** | Entran en el MVP: millas y puntos, extracción de reservas pegadas (en el dispositivo, sin IA) y autocompletar por número de vuelo (opcional, con la API key gratuita del propio usuario). Las dos últimas van en una fase posterior al núcleo. |
| D5 | **Proyecto Xcode generado con XcodeGen** | Sin Mac no se puede editar un `.xcodeproj` a mano de forma fiable. Se versiona `project.yml` y el CI ejecuta `xcodegen generate`. Con un Mac funciona igual. |

### Ajuste del plan de fases

- **Fase 1** añade: repositorio GitHub, workflow de CI (build + tests + capturas de UI + `.ipa` sin firmar) y XcodeGen.
- **Fase 6b (nueva):** millas y puntos.
- **Fase 8b (nueva):** extracción de reservas pegadas y autocompletar por número de vuelo con la key del usuario.
- **Fase 9:** TestFlight e iCloud quedan condicionados a tener cuenta de desarrollador. Mientras tanto, la entrega es el `.ipa` + la guía de sideloading.

## 11. Preguntas originales

1. **¿Tienes acceso a un Mac** (propio o en la nube) o prefieres compilar con CI en macOS? Sin esto no se puede compilar.
2. **¿Te parece bien pagar el Apple Developer Program (99 USD/año)** para TestFlight y App Store? Si no, la distribución queda limitada a instalar desde Xcode.
3. ~~¿Confirmas que la referencia es Flown de flown-app.com?~~ ✅ Confirmado.
4. ¿Puedes pasarme **capturas de las pantallas que no son públicas** (alta de vuelo, Ajustes, Miles, importación, estados vacíos)? Es opcional y no bloquea la Fase 1.
5. ¿Te encaja **iOS 18 como versión mínima** y español + inglés como idiomas iniciales?
6. ¿Dejamos fuera del MVP las noticias, las millas/puntos y el autocompletado por número de vuelo?
