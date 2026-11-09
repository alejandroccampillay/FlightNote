# Base de referencia aeronáutica

`build_reference_db.py` genera `Packages/FlightNoteKit/Sources/FNReferenceData/Resources/reference.sqlite`.

Es un SQLite de **solo lectura** que va dentro de la app. Funciona sin conexión y nunca se mezcla con los datos del usuario.

## Uso

```bash
python -m pip install -r Tools/reference-data/requirements.txt
```

```bash
python Tools/reference-data/build_reference_db.py
```

Opciones:

- `--cache-dir DIR`: carpeta donde se guardan las descargas (por defecto, `.cache/`, que no se versiona).
- `--offline`: reconstruye la base solo con lo que ya hay en la caché.

## Contenido (v1)

| Tabla | Origen | Filtro |
|---|---|---|
| `airport` | OurAirports (dominio público) | Aeropuertos grandes y medianos (todos); pequeños e hidrobases solo si tienen código IATA y servicio regular |
| `country` | OurAirports | Todos, con continente |
| `airline` | OpenFlights (ODbL) + `airline_overrides.json` | Con código IATA o ICAO válido. Incluye aerolíneas desaparecidas (`active = 0`) para poder registrar vuelos antiguos |
| `aircraft_type` | `aircraft_types.json` (propio) | Unos 110 tipos comerciales comunes |
| `registration_prefix` | `registration_prefixes.json` (propio) | Prefijos de nacionalidad OACI → país |
| `meta` | — | Versión de esquema, fecha de generación, fuentes |

- La zona horaria de cada aeropuerto se calcula a partir de sus coordenadas con `timezonefinder`.
- `search_text` está en minúsculas y sin diacríticos, igual que `SearchText.fold` en la app.

## Limitaciones conocidas

- Los datos de aerolíneas de OpenFlights llevan años sin actualizarse. Las correcciones van en `airline_overrides.json`, indexadas por código ICAO. La app permite siempre escribir la aerolínea a mano.
- No se incluyen los aeropuertos cerrados sin código IATA.
- La lista de tipos de aeronave no es exhaustiva. Si un tipo no aparece, se puede escribir a mano.
