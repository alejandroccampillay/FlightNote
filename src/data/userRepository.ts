// Repositorio de los datos del usuario: vuelos y aeronaves (una ficha por matrícula).
import { distanceKm } from '../domain/geo.ts';
import { registrationDisplay, registrationKey } from '../domain/registration.ts';
import type { CabinClass } from '../domain/types.ts';
import type { SqlExecutor, SqlValue } from './sql.ts';

export interface AircraftRecord {
  id: string;
  registration: string;
  registration_key: string;
  type_icao: string | null;
  manufacturer: string | null;
  model: string | null;
  variant: string | null;
  name: string | null;
  operator_name: string | null;
  registration_country: string | null;
  notes: string | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightRecord {
  id: string;
  flight_date: string;
  airline_name: string | null;
  airline_iata: string | null;
  airline_icao: string | null;
  flight_number: string | null;
  origin_code: string;
  origin_name: string | null;
  origin_city: string | null;
  origin_country: string | null;
  origin_lat: number | null;
  origin_lon: number | null;
  origin_tz: string | null;
  destination_code: string;
  destination_name: string | null;
  destination_city: string | null;
  destination_country: string | null;
  destination_lat: number | null;
  destination_lon: number | null;
  destination_tz: string | null;
  departure_scheduled: string | null;
  arrival_scheduled: string | null;
  departure_actual: string | null;
  arrival_actual: string | null;
  duration_manual_min: number | null;
  distance_km: number;
  cabin_class: CabinClass;
  seat: string | null;
  seat_position: string | null;
  terminal: string | null;
  gate: string | null;
  reason: string | null;
  notes: string | null;
  aircraft_type_icao: string | null;
  aircraft_manufacturer: string | null;
  aircraft_model: string | null;
  aircraft_variant: string | null;
  aircraft_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Datos para crear o editar un vuelo. La matrícula se resuelve a una ficha de aeronave. */
export type FlightInput = Partial<
  Omit<FlightRecord, 'id' | 'distance_km' | 'aircraft_id' | 'created_at' | 'updated_at'>
> &
  Pick<FlightRecord, 'flight_date' | 'origin_code' | 'destination_code'> & {
    registration?: string | null;
  };

/** Columnas del vuelo que el usuario puede editar (lista blanca para construir el SQL). */
const EDITABLE_FLIGHT_COLUMNS = [
  'flight_date', 'airline_name', 'airline_iata', 'airline_icao', 'flight_number',
  'origin_code', 'origin_name', 'origin_city', 'origin_country', 'origin_lat', 'origin_lon', 'origin_tz',
  'destination_code', 'destination_name', 'destination_city', 'destination_country',
  'destination_lat', 'destination_lon', 'destination_tz',
  'departure_scheduled', 'arrival_scheduled', 'departure_actual', 'arrival_actual', 'duration_manual_min',
  'cabin_class', 'seat', 'seat_position', 'terminal', 'gate', 'reason', 'notes',
  'aircraft_type_icao', 'aircraft_manufacturer', 'aircraft_model', 'aircraft_variant',
] as const satisfies readonly (keyof FlightInput)[];

const AIRCRAFT_FILLABLE = [
  'type_icao',
  'manufacturer',
  'model',
  'variant',
  'name',
  'operator_name',
  'registration_country',
  'photo_uri',
] as const;

export interface UserRepositoryOptions {
  newId: () => string;
  now?: () => Date;
}

export class UserRepository {
  private readonly db: SqlExecutor;
  private readonly newId: () => string;
  private readonly now: () => Date;

  constructor(db: SqlExecutor, options: UserRepositoryOptions) {
    this.db = db;
    this.newId = options.newId;
    this.now = options.now ?? (() => new Date());
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  // MARK: Aeronaves

  async aircraftByRegistration(raw: string): Promise<AircraftRecord | null> {
    const key = registrationKey(raw);
    if (!key) return null;
    return this.db.getFirstAsync<AircraftRecord>('SELECT * FROM aircraft WHERE registration_key = ?', [key]);
  }

  async aircraftById(id: string): Promise<AircraftRecord | null> {
    return this.db.getFirstAsync<AircraftRecord>('SELECT * FROM aircraft WHERE id = ?', [id]);
  }

  /** Devuelve la ficha de esa matrícula o la crea. `null` si la matrícula está vacía. */
  async findOrCreateAircraft(
    raw: string,
    details: Partial<Pick<AircraftRecord, (typeof AIRCRAFT_FILLABLE)[number]>> = {},
  ): Promise<AircraftRecord | null> {
    const key = registrationKey(raw);
    if (!key) return null;
    const existing = await this.aircraftByRegistration(raw);
    if (existing) {
      // Completa solo los campos vacíos: nunca pisa lo que el usuario ya corrigió.
      const missing = AIRCRAFT_FILLABLE.filter((f) => existing[f] == null && details[f] != null);
      if (missing.length > 0) {
        await this.db.runAsync(
          `UPDATE aircraft SET ${missing.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
          [...missing.map((f) => details[f] ?? null), this.timestamp(), existing.id],
        );
        return this.aircraftById(existing.id);
      }
      return existing;
    }
    const ts = this.timestamp();
    const id = this.newId();
    const fields = AIRCRAFT_FILLABLE.filter((f) => details[f] != null);
    await this.db.runAsync(
      `INSERT INTO aircraft (id, registration, registration_key, ${fields.map((f) => `${f}, `).join('')}created_at, updated_at)
       VALUES (?, ?, ?, ${fields.map(() => '?, ').join('')}?, ?)`,
      [id, registrationDisplay(raw), key, ...fields.map((f) => details[f] ?? null), ts, ts],
    );
    return this.aircraftById(id);
  }

  /**
   * Cambia la matrícula de una ficha. Si ya existe otra ficha con esa matrícula,
   * fusiona ambas (los vuelos pasan a la existente) y devuelve la superviviente.
   */
  async renameAircraft(id: string, newRegistration: string): Promise<AircraftRecord | null> {
    const key = registrationKey(newRegistration);
    if (!key) throw new Error('La matrícula no puede estar vacía.');
    const other = await this.aircraftByRegistration(newRegistration);
    if (other && other.id !== id) {
      await this.mergeAircraft(id, other.id);
      return this.aircraftById(other.id);
    }
    await this.db.runAsync(
      'UPDATE aircraft SET registration = ?, registration_key = ?, updated_at = ? WHERE id = ?',
      [registrationDisplay(newRegistration), key, this.timestamp(), id],
    );
    return this.aircraftById(id);
  }

  /** Mueve los vuelos de `sourceId` a `targetId`, completa datos vacíos y elimina `sourceId`. */
  async mergeAircraft(sourceId: string, targetId: string): Promise<void> {
    if (sourceId === targetId) return;
    const source = await this.aircraftById(sourceId);
    const target = await this.aircraftById(targetId);
    if (!source || !target) throw new Error('Aeronave no encontrada.');
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('UPDATE flight SET aircraft_id = ? WHERE aircraft_id = ?', [targetId, sourceId]);
      const missing = AIRCRAFT_FILLABLE.filter((f) => target[f] == null && source[f] != null);
      const notes = [target.notes, source.notes].filter((n): n is string => !!n).join('\n') || null;
      await this.db.runAsync(
        `UPDATE aircraft SET ${missing.map((f) => `${f} = ?, `).join('')}notes = ?, updated_at = ? WHERE id = ?`,
        [...missing.map((f) => source[f]), notes, this.timestamp(), targetId],
      );
      await this.db.runAsync('DELETE FROM aircraft WHERE id = ?', [sourceId]);
    });
  }

  async deleteAircraft(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM aircraft WHERE id = ?', [id]);
  }

  async listAircraft(): Promise<(AircraftRecord & { flight_count: number; total_km: number })[]> {
    return this.db.getAllAsync(
      `SELECT a.*, COUNT(f.id) AS flight_count, COALESCE(SUM(f.distance_km), 0) AS total_km
       FROM aircraft a LEFT JOIN flight f ON f.aircraft_id = a.id
       GROUP BY a.id ORDER BY flight_count DESC, a.registration`,
      [],
    );
  }

  // MARK: Vuelos

  async flightById(id: string): Promise<FlightRecord | null> {
    return this.db.getFirstAsync<FlightRecord>('SELECT * FROM flight WHERE id = ?', [id]);
  }

  async listFlights(): Promise<FlightRecord[]> {
    return this.db.getAllAsync<FlightRecord>(
      'SELECT * FROM flight ORDER BY flight_date DESC, departure_scheduled DESC, created_at DESC',
      [],
    );
  }

  async flightsForAircraft(aircraftId: string): Promise<FlightRecord[]> {
    return this.db.getAllAsync<FlightRecord>(
      'SELECT * FROM flight WHERE aircraft_id = ? ORDER BY flight_date DESC',
      [aircraftId],
    );
  }

  /** Crea un vuelo. Calcula la distancia y asocia (o crea) la ficha de la matrícula. */
  async createFlight(input: FlightInput): Promise<FlightRecord> {
    const id = this.newId();
    const ts = this.timestamp();
    const row = { ...(await this.flightRow(input)), id, created_at: ts, updated_at: ts };
    const columns = Object.keys(row) as (keyof typeof row)[];
    await this.db.runAsync(
      `INSERT INTO flight (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((c) => row[c]),
    );
    const created = await this.flightById(id);
    if (!created) throw new Error('No se pudo guardar el vuelo.');
    return created;
  }

  /** Reemplaza los datos editables de un vuelo (las fotos y la fecha de creación se conservan). */
  async updateFlight(id: string, input: FlightInput): Promise<FlightRecord> {
    const existing = await this.flightById(id);
    if (!existing) throw new Error('Vuelo no encontrado.');
    const row = { ...(await this.flightRow(input)), updated_at: this.timestamp() };
    const columns = Object.keys(row) as (keyof typeof row)[];
    await this.db.runAsync(
      `UPDATE flight SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...columns.map((c) => row[c]), id],
    );
    const updated = await this.flightById(id);
    if (!updated) throw new Error('No se pudo guardar el vuelo.');
    return updated;
  }

  async deleteFlight(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM flight WHERE id = ?', [id]);
  }

  /** Columnas editables del vuelo a partir del formulario, con distancia y aeronave resueltas. */
  private async flightRow(input: FlightInput): Promise<Record<string, SqlValue>> {
    const aircraft = input.registration
      ? await this.findOrCreateAircraft(input.registration, {
          type_icao: input.aircraft_type_icao ?? null,
          manufacturer: input.aircraft_manufacturer ?? null,
          model: input.aircraft_model ?? null,
          variant: input.aircraft_variant ?? null,
          operator_name: input.airline_name ?? null,
        })
      : null;

    const { origin_lat, origin_lon, destination_lat, destination_lon } = input;
    const distance =
      origin_lat != null && origin_lon != null && destination_lat != null && destination_lon != null
        ? distanceKm(
            { latitude: origin_lat, longitude: origin_lon },
            { latitude: destination_lat, longitude: destination_lon },
          )
        : 0;

    const row: Record<string, SqlValue> = {};
    for (const column of EDITABLE_FLIGHT_COLUMNS) {
      row[column] = input[column] ?? null;
    }
    row.cabin_class = input.cabin_class ?? 'economy';
    row.distance_km = distance;
    row.aircraft_id = aircraft?.id ?? null;
    return row;
  }

  async counts(): Promise<{ flights: number; aircraft: number }> {
    const flights = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM flight', []);
    const aircraft = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM aircraft', []);
    return { flights: flights?.n ?? 0, aircraft: aircraft?.n ?? 0 };
  }
}
