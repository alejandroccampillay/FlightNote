// Esquema de la base de datos del usuario (flightnote.db) y sus migraciones.
// Regla: nunca se edita una migración publicada; cada cambio añade una nueva versión.
import type { SqlExecutor } from './sql.ts';

interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE aircraft (
        id                   TEXT PRIMARY KEY NOT NULL,
        registration         TEXT NOT NULL,          -- como la escribe el usuario: "CC-BGG"
        registration_key     TEXT NOT NULL UNIQUE,   -- normalizada: "CCBGG" (sin duplicados)
        type_icao            TEXT,
        manufacturer         TEXT,
        model                TEXT,
        variant              TEXT,
        name                 TEXT,                   -- nombre comercial o de bautismo
        operator_name        TEXT,
        registration_country TEXT,
        notes                TEXT,
        photo_uri            TEXT,
        created_at           TEXT NOT NULL,
        updated_at           TEXT NOT NULL
      );

      CREATE TABLE flight (
        id                    TEXT PRIMARY KEY NOT NULL,
        flight_date           TEXT NOT NULL,         -- fecha local de salida "YYYY-MM-DD"
        airline_name          TEXT,
        airline_iata          TEXT,
        airline_icao          TEXT,
        flight_number         TEXT,

        -- Copia de los datos del aeropuerto: el historial no depende de la base de referencia.
        origin_code           TEXT NOT NULL,
        origin_name           TEXT,
        origin_city           TEXT,
        origin_country        TEXT,
        origin_lat            REAL,
        origin_lon            REAL,
        origin_tz             TEXT,
        destination_code      TEXT NOT NULL,
        destination_name      TEXT,
        destination_city      TEXT,
        destination_country   TEXT,
        destination_lat       REAL,
        destination_lon       REAL,
        destination_tz        TEXT,

        -- Horas "de reloj" locales de cada aeropuerto: "YYYY-MM-DDTHH:mm".
        departure_scheduled   TEXT,
        arrival_scheduled     TEXT,
        departure_actual      TEXT,
        arrival_actual        TEXT,
        duration_manual_min   INTEGER,              -- tiene prioridad sobre la calculada
        distance_km           REAL NOT NULL DEFAULT 0,

        cabin_class           TEXT NOT NULL DEFAULT 'economy',
        seat                  TEXT,
        seat_position         TEXT,
        terminal              TEXT,
        gate                  TEXT,
        reason                TEXT,
        notes                 TEXT,

        -- Aeronave tal como se voló (aunque no se conozca la matrícula).
        aircraft_type_icao    TEXT,
        aircraft_manufacturer TEXT,
        aircraft_model        TEXT,
        aircraft_variant      TEXT,
        aircraft_id           TEXT REFERENCES aircraft(id) ON DELETE SET NULL,

        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL
      );
      CREATE INDEX flight_date_idx ON flight(flight_date);
      CREATE INDEX flight_aircraft_idx ON flight(aircraft_id);

      CREATE TABLE flight_photo (
        id         TEXT PRIMARY KEY NOT NULL,
        flight_id  TEXT NOT NULL REFERENCES flight(id) ON DELETE CASCADE,
        uri        TEXT NOT NULL,                     -- fichero dentro del directorio de la app
        caption    TEXT,
        taken_at   TEXT,
        sort_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX flight_photo_flight_idx ON flight_photo(flight_id);
    `,
  },
];

export const USER_DB_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

/** Ajustes de conexión: se ejecutan en cada apertura. */
export async function configureConnection(db: SqlExecutor): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
}

/** Aplica las migraciones pendientes según `PRAGMA user_version`. */
export async function migrateUserDb(db: SqlExecutor): Promise<number> {
  await configureConnection(db);
  const current = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []))?.user_version ?? 0;
  if (current > USER_DB_VERSION) {
    throw new Error(
      `La base de datos (v${current}) es más nueva que esta versión de la app (v${USER_DB_VERSION}).`,
    );
  }
  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
  return USER_DB_VERSION;
}
