#!/usr/bin/env python3
"""Genera la base de referencia aeronáutica de FlightNote (SQLite de solo lectura).

Fuentes:
  - OurAirports (dominio público): aeropuertos y países.
  - OpenFlights (ODbL): aerolíneas.
  - timezonefinder (MIT; datos de timezone-boundary-builder, ODbL): zona horaria por coordenadas.
  - aircraft_types.json y registration_prefixes.json: listas propias del proyecto.

Uso:
  python -m pip install -r Tools/reference-data/requirements.txt
  python Tools/reference-data/build_reference_db.py [--out RUTA] [--cache-dir DIR] [--offline]
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import sqlite3
import sys
import unicodedata
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
DEFAULT_OUT = REPO / "Packages/FlightNoteKit/Sources/FNReferenceData/Resources/reference.sqlite"

SOURCES = {
    "airports.csv": "https://davidmegginson.github.io/ourairports-data/airports.csv",
    "countries.csv": "https://davidmegginson.github.io/ourairports-data/countries.csv",
    "airlines.dat": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat",
}

SCHEMA_VERSION = 1

# Nombres de país de OpenFlights que no coinciden con OurAirports.
COUNTRY_ALIASES = {
    "Congo (Kinshasa)": "CD", "Congo (Brazzaville)": "CG", "Burma": "MM", "Myanmar": "MM",
    "Russia": "RU", "Russian Federation": "RU", "South Korea": "KR", "Korea": "KR",
    "Republic of Korea": "KR", "North Korea": "KP", "Democratic People's Republic of Korea": "KP",
    "Vietnam": "VN", "Viet Nam": "VN", "Laos": "LA", "Lao Peoples Democratic Republic": "LA",
    "Iran": "IR", "Syria": "SY", "Syrian Arab Republic": "SY", "Macedonia": "MK",
    "Moldova": "MD", "Republic of Moldova": "MD", "Tanzania": "TZ", "Cape Verde": "CV",
    "Cote d'Ivoire": "CI", "Ivory Coast": "CI", "Czech Republic": "CZ", "Czechia": "CZ",
    "Hong Kong SAR of China": "HK", "Hong Kong": "HK", "Macao": "MO", "Macau": "MO",
    "Taiwan": "TW", "Brunei": "BN", "Bolivia": "BO", "Venezuela": "VE",
    "United States": "US", "United Kingdom": "GB", "Swaziland": "SZ", "East Timor": "TL",
    "Micronesia": "FM", "Palestine": "PS", "Netherlands Antilles": "CW",
    "Virgin Islands": "VI", "British Virgin Islands": "VG", "Reunion": "RE",
    "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Vincent and the Grenadines": "VC",
    "Bahamas": "BS", "Gambia": "GM", "Turks and Caicos Islands": "TC", "Kyrgyzstan": "KG",
    "Libya": "LY", "Libyan Arab Jamahiriya": "LY", "Sao Tome and Principe": "ST",
    "Republic of the Congo": "CG", "Democratic Republic of the Congo": "CD",
}

AIRPORT_KINDS_KEEP = {"large_airport", "medium_airport", "small_airport", "seaplane_base", "closed"}


def fold(text: str) -> str:
    """Minúsculas sin diacríticos, igual que en la app (FNDomain.SearchText.fold)."""
    norm = unicodedata.normalize("NFKD", text)
    return "".join(c for c in norm if not unicodedata.combining(c)).lower()


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if value in ("", "\\N", "-", "N/A", "n/a"):
        return None
    return value


def fetch(name: str, cache_dir: Path, offline: bool) -> str:
    path = cache_dir / name
    if not path.exists():
        if offline:
            sys.exit(f"Falta {path} y se pidió --offline")
        url = SOURCES[name]
        print(f"Descargando {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "FlightNote-reference-builder"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            path.write_bytes(resp.read())
    return path.read_text(encoding="utf-8")


def build(out: Path, cache_dir: Path, offline: bool) -> None:
    try:
        from timezonefinder import TimezoneFinder
    except ImportError:
        sys.exit("Falta timezonefinder: python -m pip install -r Tools/reference-data/requirements.txt")
    tzf = TimezoneFinder()

    cache_dir.mkdir(parents=True, exist_ok=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    db = sqlite3.connect(out)
    db.executescript(
        """
        PRAGMA journal_mode = DELETE;
        CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE country (
            iso TEXT PRIMARY KEY, name TEXT NOT NULL, continent TEXT NOT NULL
        );
        CREATE TABLE airport (
            id INTEGER PRIMARY KEY,
            ident TEXT NOT NULL,
            iata TEXT, icao TEXT,
            name TEXT NOT NULL, city TEXT,
            country_iso TEXT NOT NULL, region TEXT, continent TEXT NOT NULL,
            latitude REAL NOT NULL, longitude REAL NOT NULL, elevation_ft INTEGER,
            time_zone TEXT, kind TEXT NOT NULL, scheduled INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            search_text TEXT NOT NULL
        );
        CREATE INDEX airport_iata ON airport(iata);
        CREATE INDEX airport_icao ON airport(icao);
        CREATE TABLE airline (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL, alias TEXT, iata TEXT, icao TEXT, callsign TEXT,
            country_iso TEXT, active INTEGER NOT NULL,
            search_text TEXT NOT NULL
        );
        CREATE INDEX airline_iata ON airline(iata);
        CREATE INDEX airline_icao ON airline(icao);
        CREATE TABLE aircraft_type (
            icao TEXT PRIMARY KEY, manufacturer TEXT NOT NULL, model TEXT NOT NULL,
            variant TEXT NOT NULL, category TEXT NOT NULL, search_text TEXT NOT NULL
        );
        CREATE TABLE registration_prefix (prefix TEXT PRIMARY KEY, country_iso TEXT NOT NULL);
        """
    )

    # Países
    countries = list(csv.DictReader(io.StringIO(fetch("countries.csv", cache_dir, offline))))
    name_to_iso: dict[str, str] = {}
    for c in countries:
        db.execute("INSERT INTO country VALUES (?,?,?)", (c["code"], c["name"], c["continent"]))
        name_to_iso[c["name"]] = c["code"]
    name_to_iso.update(COUNTRY_ALIASES)

    # Aeropuertos
    rank_by_kind = {"large_airport": 0, "medium_airport": 1, "small_airport": 2, "seaplane_base": 3, "closed": 4}
    n_airports = 0
    for a in csv.DictReader(io.StringIO(fetch("airports.csv", cache_dir, offline))):
        kind = a["type"]
        if kind not in AIRPORT_KINDS_KEEP:
            continue
        iata = clean(a.get("iata_code"))
        scheduled = a.get("scheduled_service") == "yes"
        if kind in ("small_airport", "seaplane_base", "closed") and not iata:
            continue
        if kind in ("small_airport", "seaplane_base") and not (iata and scheduled):
            continue
        icao = clean(a.get("icao_code")) or None
        if icao is None:
            gps = clean(a.get("gps_code"))
            if gps and len(gps) == 4 and gps.isalpha():
                icao = gps
        lat, lon = float(a["latitude_deg"]), float(a["longitude_deg"])
        elevation = clean(a.get("elevation_ft"))
        city = clean(a.get("municipality"))
        tz = tzf.timezone_at(lng=lon, lat=lat)
        search = fold(" ".join(x for x in (iata, icao, a["name"], city, clean(a.get("keywords"))) if x))
        db.execute(
            "INSERT INTO airport VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                int(a["id"]), a["ident"], iata, icao, a["name"], city,
                a["iso_country"], clean(a.get("iso_region")), a["continent"],
                lat, lon, int(float(elevation)) if elevation else None,
                tz, kind.replace("_airport", ""), 1 if scheduled else 0,
                rank_by_kind[kind], search,
            ),
        )
        n_airports += 1

    # Aerolíneas (OpenFlights: id,name,alias,iata,icao,callsign,country,active)
    n_airlines = 0
    reader = csv.reader(io.StringIO(fetch("airlines.dat", cache_dir, offline)))
    for row in reader:
        if len(row) < 8:
            continue
        ident, name, alias, iata, icao, callsign, country, active = (clean(x) for x in row[:8])
        if not name or int(ident or 0) <= 0:
            continue
        if iata and (len(iata) != 2 or not iata.isalnum()):
            iata = None
        if icao and (len(icao) != 3 or not icao.isalpha()):
            icao = None
        if not iata and not icao:
            continue
        search = fold(" ".join(x for x in (iata, icao, name, alias, callsign) if x))
        db.execute(
            "INSERT INTO airline VALUES (?,?,?,?,?,?,?,?,?)",
            (int(ident), name, alias, iata, icao, callsign, name_to_iso.get(country or ""),
             1 if active == "Y" else 0, search),
        )
        n_airlines += 1

    # Correcciones propias sobre OpenFlights (datos desactualizados): por ICAO.
    overrides = json.loads((HERE / "airline_overrides.json").read_text(encoding="utf-8"))
    next_id = (db.execute("SELECT MAX(id) FROM airline").fetchone()[0] or 0) + 1
    for o in overrides:
        rows = db.execute("SELECT id FROM airline WHERE icao = ?", (o["icao"],)).fetchall()
        if rows:
            fields = {k: o[k] for k in ("iata", "name", "alias") if k in o}
            if "country" in o:
                fields["country_iso"] = o["country"]
            if "active" in o:
                fields["active"] = 1 if o["active"] else 0
            for (row_id,) in rows:
                if fields:
                    sets = ", ".join(f"{k} = ?" for k in fields)
                    db.execute(f"UPDATE airline SET {sets} WHERE id = ?", (*fields.values(), row_id))
        elif "name" in o:
            db.execute(
                "INSERT INTO airline VALUES (?,?,?,?,?,?,?,?,?)",
                (next_id, o["name"], o.get("alias"), o.get("iata"), o["icao"], None,
                 o.get("country"), 1 if o.get("active", True) else 0, ""),
            )
            next_id += 1
            n_airlines += 1
    for row_id, name, alias, iata, icao, callsign in db.execute(
        "SELECT id, name, alias, iata, icao, callsign FROM airline"
    ).fetchall():
        search = fold(" ".join(x for x in (iata, icao, name, alias, callsign) if x))
        db.execute("UPDATE airline SET search_text = ? WHERE id = ?", (search, row_id))

    # Tipos de aeronave
    types = json.loads((HERE / "aircraft_types.json").read_text(encoding="utf-8"))
    for t in types:
        search = fold(f'{t["icao"]} {t["manufacturer"]} {t["model"]} {t["variant"]}')
        db.execute(
            "INSERT INTO aircraft_type VALUES (?,?,?,?,?,?)",
            (t["icao"], t["manufacturer"], t["model"], t["variant"], t["category"], search),
        )

    # Prefijos de matrícula
    prefixes = json.loads((HERE / "registration_prefixes.json").read_text(encoding="utf-8"))
    for p in prefixes:
        db.execute("INSERT INTO registration_prefix VALUES (?,?)", (p["prefix"], p["country"]))

    meta = {
        "schema_version": str(SCHEMA_VERSION),
        "built_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources": "OurAirports (public domain); OpenFlights airlines (ODbL); timezonefinder (ODbL data)",
    }
    db.executemany("INSERT INTO meta VALUES (?,?)", meta.items())
    db.commit()
    db.execute("VACUUM")
    db.close()

    size_mb = out.stat().st_size / 1_048_576
    print(f"OK {out} — {n_airports} aeropuertos, {n_airlines} aerolíneas, {len(types)} tipos, "
          f"{len(prefixes)} prefijos, {size_mb:.1f} MB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--cache-dir", type=Path, default=HERE / ".cache")
    parser.add_argument("--offline", action="store_true", help="usar solo los ficheros de --cache-dir")
    args = parser.parse_args()
    build(args.out, args.cache_dir, args.offline)


if __name__ == "__main__":
    main()
