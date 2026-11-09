// Consultas a la base aeronáutica de referencia (assets/data/reference.sqlite, solo lectura).
import type { RegistrationPrefix } from '../domain/registration.ts';
import { escapeLike, searchTokens } from '../domain/search.ts';
import type { AircraftTypeInfo, AirlineInfo, AirportInfo } from '../domain/types.ts';
import type { SqlExecutor, SqlValue } from './sql.ts';

interface AirportRow {
  id: number;
  ident: string;
  iata: string | null;
  icao: string | null;
  name: string;
  city: string | null;
  country_iso: string;
  region: string | null;
  continent: string;
  latitude: number;
  longitude: number;
  elevation_ft: number | null;
  time_zone: string | null;
  kind: string;
  scheduled: number;
}

interface AirlineRow {
  id: number;
  name: string;
  alias: string | null;
  iata: string | null;
  icao: string | null;
  callsign: string | null;
  country_iso: string | null;
  active: number;
}

export interface ReferenceStatistics {
  airports: number;
  airlines: number;
  aircraftTypes: number;
  schemaVersion: number;
  builtAt: string;
}

const toAirport = (r: AirportRow): AirportInfo => ({
  id: r.id,
  ident: r.ident,
  iata: r.iata,
  icao: r.icao,
  name: r.name,
  city: r.city,
  countryIso: r.country_iso,
  region: r.region,
  continent: r.continent,
  coordinate: { latitude: r.latitude, longitude: r.longitude },
  elevationFt: r.elevation_ft,
  timeZone: r.time_zone,
  kind: r.kind,
  hasScheduledService: r.scheduled === 1,
});

const toAirline = (r: AirlineRow): AirlineInfo => ({
  id: r.id,
  name: r.name,
  alias: r.alias,
  iata: r.iata,
  icao: r.icao,
  callsign: r.callsign,
  countryIso: r.country_iso,
  isActive: r.active === 1,
});

const normalizeCode = (code: string) => code.trim().toUpperCase();

/** Una condición `search_text LIKE '%palabra%'` por cada palabra de la consulta. */
function tokenFilter(query: string): { where: string; params: SqlValue[] } {
  const tokens = searchTokens(query);
  return {
    where: tokens.map(() => "search_text LIKE ? ESCAPE '\\'").join(' AND '),
    params: tokens.map((t) => `%${escapeLike(t)}%`),
  };
}

export class ReferenceRepository {
  private readonly db: SqlExecutor;

  constructor(db: SqlExecutor) {
    this.db = db;
  }

  async statistics(): Promise<ReferenceStatistics> {
    const count = async (table: string) =>
      (await this.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`, []))?.n ?? 0;
    const meta = await this.db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM meta', []);
    const metaValue = (key: string) => meta.find((m) => m.key === key)?.value ?? '';
    return {
      airports: await count('airport'),
      airlines: await count('airline'),
      aircraftTypes: await count('aircraft_type'),
      schemaVersion: Number(metaValue('schema_version')) || 0,
      builtAt: metaValue('built_at'),
    };
  }

  /** Aeropuerto por código IATA (3), ICAO (4) o identificador. */
  async airport(code: string): Promise<AirportInfo | null> {
    const c = normalizeCode(code);
    if (!c) return null;
    const column = c.length === 3 ? 'iata' : c.length === 4 ? 'icao' : 'ident';
    const row = await this.db.getFirstAsync<AirportRow>(
      `SELECT * FROM airport WHERE ${column} = ? ORDER BY rank LIMIT 1`,
      [c],
    );
    return row ? toAirport(row) : null;
  }

  async searchAirports(query: string, limit = 20): Promise<AirportInfo[]> {
    const { where, params } = tokenFilter(query);
    if (!where) return [];
    const c = normalizeCode(query);
    const rows = await this.db.getAllAsync<AirportRow>(
      `SELECT * FROM airport WHERE ${where}
       ORDER BY CASE WHEN iata = ? THEN 0 WHEN icao = ? THEN 1 ELSE 2 END, rank, scheduled DESC, name
       LIMIT ?`,
      [...params, c, c, limit],
    );
    return rows.map(toAirport);
  }

  /** Aerolínea por código IATA (2) o ICAO (3); prefiere las activas. */
  async airline(code: string): Promise<AirlineInfo | null> {
    const c = normalizeCode(code);
    const column = c.length === 2 ? 'iata' : c.length === 3 ? 'icao' : null;
    if (!column) return null;
    const row = await this.db.getFirstAsync<AirlineRow>(
      `SELECT * FROM airline WHERE ${column} = ? ORDER BY active DESC, id LIMIT 1`,
      [c],
    );
    return row ? toAirline(row) : null;
  }

  async searchAirlines(query: string, limit = 20): Promise<AirlineInfo[]> {
    const { where, params } = tokenFilter(query);
    if (!where) return [];
    const c = normalizeCode(query);
    const rows = await this.db.getAllAsync<AirlineRow>(
      `SELECT * FROM airline WHERE ${where}
       ORDER BY CASE WHEN iata = ? THEN 0 WHEN icao = ? THEN 1 ELSE 2 END, active DESC, name
       LIMIT ?`,
      [...params, c, c, limit],
    );
    return rows.map(toAirline);
  }

  async aircraftType(icao: string): Promise<AircraftTypeInfo | null> {
    return this.db.getFirstAsync<AircraftTypeInfo>(
      'SELECT icao, manufacturer, model, variant, category FROM aircraft_type WHERE icao = ?',
      [normalizeCode(icao)],
    );
  }

  async searchAircraftTypes(query: string, limit = 20): Promise<AircraftTypeInfo[]> {
    const { where, params } = tokenFilter(query);
    if (!where) return [];
    return this.db.getAllAsync<AircraftTypeInfo>(
      `SELECT icao, manufacturer, model, variant, category FROM aircraft_type WHERE ${where}
       ORDER BY CASE WHEN icao = ? THEN 0 ELSE 1 END, manufacturer, variant LIMIT ?`,
      [...params, normalizeCode(query), limit],
    );
  }

  async registrationPrefixes(): Promise<RegistrationPrefix[]> {
    return this.db.getAllAsync<RegistrationPrefix>(
      'SELECT prefix, country_iso AS countryIso FROM registration_prefix',
      [],
    );
  }
}
