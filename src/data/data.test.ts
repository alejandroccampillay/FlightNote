/// <reference types="node" />
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

import { RegistrationCountryResolver } from '../domain/registration.ts';
import { airportCode } from '../domain/types.ts';
import { ReferenceRepository } from './referenceRepository.ts';
import { openNodeDatabase } from './testing/nodeSqlite.ts';
import { USER_DB_VERSION, migrateUserDb } from './userSchema.ts';
import { UserRepository, type FlightInput } from './userRepository.ts';

const referencePath = fileURLToPath(new URL('../../assets/data/reference.sqlite', import.meta.url));
const reference = new ReferenceRepository(openNodeDatabase(referencePath, true));

describe('base de referencia', () => {
  test('estadísticas', async () => {
    const stats = await reference.statistics();
    assert.ok(stats.airports > 5_000);
    assert.ok(stats.airlines > 1_000);
    assert.ok(stats.aircraftTypes > 100);
    assert.equal(stats.schemaVersion, 1);
  });

  test('aeropuerto por IATA e ICAO', async () => {
    const scl = await reference.airport('scl');
    assert.equal(scl?.icao, 'SCEL');
    assert.equal(scl?.countryIso, 'CL');
    assert.equal(scl?.continent, 'SA');
    assert.equal(scl?.timeZone, 'America/Santiago');
    assert.equal((await reference.airport('LEMD'))?.iata, 'MAD');
    assert.equal(await reference.airport(''), null);
  });

  test('búsqueda por nombre sin acentos y código exacto primero', async () => {
    assert.equal((await reference.searchAirports('barajas', 5))[0]?.iata, 'MAD');
    assert.ok((await reference.searchAirports('Santiago merino', 5)).some((a) => a.iata === 'SCL'));
    const zrh = (await reference.searchAirports('ZRH', 5))[0];
    assert.equal(zrh && airportCode(zrh), 'ZRH');
    assert.deepEqual(await reference.searchAirports('%', 5), []);
    assert.deepEqual(await reference.searchAirports('  ', 5), []);
  });

  test('aerolíneas: activas y nombres corregidos', async () => {
    assert.equal((await reference.airline('LA'))?.name, 'LATAM Airlines');
    assert.equal((await reference.airline('JA'))?.name, 'JetSMART');
    assert.equal((await reference.airline('IBE'))?.iata, 'IB');
    assert.equal(await reference.airline('X'), null);
    assert.ok((await reference.searchAirlines('iberia', 5)).some((a) => a.icao === 'IBE'));
  });

  test('tipos de aeronave', async () => {
    const b789 = await reference.aircraftType('b789');
    assert.equal(b789?.manufacturer, 'Boeing');
    assert.equal(b789?.variant, '787-9');
    assert.equal((await reference.searchAircraftTypes('787', 10)).length, 3);
  });

  test('prefijos de matrícula reales', async () => {
    const resolver = new RegistrationCountryResolver(await reference.registrationPrefixes());
    for (const [reg, country] of [
      ['CC-BGG', 'CL'],
      ['HB-JCM', 'CH'],
      ['A7-BHA', 'QA'],
      ['TF-ICU', 'IS'],
      ['N787AL', 'US'],
      ['EC-MIG', 'ES'],
    ] as const) {
      assert.equal(resolver.countryIso(reg), country, reg);
    }
  });
});

async function makeUserRepo() {
  const db = openNodeDatabase();
  await migrateUserDb(db);
  return { db, repo: new UserRepository(db, { newId: randomUUID }) };
}

const sclMad: FlightInput = {
  flight_date: '2024-03-15',
  airline_name: 'LATAM Airlines',
  airline_iata: 'LA',
  flight_number: 'LA800',
  origin_code: 'SCL',
  origin_lat: -33.393001556396484,
  origin_lon: -70.78579711914062,
  origin_tz: 'America/Santiago',
  destination_code: 'MAD',
  destination_lat: 40.493407,
  destination_lon: -3.572249,
  destination_tz: 'Europe/Madrid',
  aircraft_type_icao: 'B789',
  aircraft_manufacturer: 'Boeing',
  aircraft_model: '787',
  aircraft_variant: '787-9',
  registration: 'CC-BGG',
};

describe('datos del usuario', () => {
  test('migraciones idempotentes', async () => {
    const { db } = await makeUserRepo();
    assert.equal(await migrateUserDb(db), USER_DB_VERSION);
    const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    assert.equal(v?.user_version, USER_DB_VERSION);
  });

  test('ejemplo del enunciado: LA800 SCL→MAD con CC-BGG', async () => {
    const { repo } = await makeUserRepo();
    const flight = await repo.createFlight(sclMad);
    assert.ok(Math.abs(flight.distance_km - 10_719.3) < 1);
    assert.equal(flight.cabin_class, 'economy');
    const aircraft = await repo.aircraftById(flight.aircraft_id!);
    assert.equal(aircraft?.registration, 'CC-BGG');
    assert.equal(aircraft?.variant, '787-9');
    assert.equal(aircraft?.operator_name, 'LATAM Airlines');
  });

  test('misma matrícula en varios vuelos → una sola ficha', async () => {
    const { repo } = await makeUserRepo();
    const a = await repo.createFlight(sclMad);
    const b = await repo.createFlight({ ...sclMad, flight_date: '2024-03-30', registration: 'cc bgg' });
    assert.equal(a.aircraft_id, b.aircraft_id);
    const fleet = await repo.listAircraft();
    assert.equal(fleet.length, 1);
    assert.equal(fleet[0]?.flight_count, 2);
    assert.ok(Math.abs((fleet[0]?.total_km ?? 0) - 2 * 10_719.3) < 2);
  });

  test('completar una ficha no pisa datos corregidos por el usuario', async () => {
    const { repo } = await makeUserRepo();
    const first = await repo.findOrCreateAircraft('CC-BGG', { variant: '787-9 (corregido)' });
    const again = await repo.findOrCreateAircraft('ccbgg', { variant: '787-9', name: 'Pegaso' });
    assert.equal(again?.id, first?.id);
    assert.equal(again?.variant, '787-9 (corregido)');
    assert.equal(again?.name, 'Pegaso');
    assert.equal(await repo.findOrCreateAircraft('--'), null);
  });

  test('renombrar a una matrícula existente fusiona las fichas', async () => {
    const { repo } = await makeUserRepo();
    const f1 = await repo.createFlight({ ...sclMad, registration: 'HB-JCM' });
    const f2 = await repo.createFlight({ ...sclMad, registration: 'HB-JCN' });
    const survivor = await repo.renameAircraft(f2.aircraft_id!, 'hb-jcm');
    assert.equal(survivor?.id, f1.aircraft_id);
    assert.equal((await repo.listAircraft()).length, 1);
    assert.equal((await repo.flightById(f2.id))?.aircraft_id, f1.aircraft_id);
  });

  test('editar un vuelo conserva fotos y fecha de creación', async () => {
    const { db, repo } = await makeUserRepo();
    const flight = await repo.createFlight(sclMad);
    await db.runAsync(
      'INSERT INTO flight_photo (id, flight_id, uri, created_at) VALUES (?, ?, ?, ?)',
      ['p1', flight.id, 'file:///foto.jpg', flight.created_at],
    );
    const updated = await repo.updateFlight(flight.id, { ...sclMad, seat: '7A', registration: null });
    assert.equal(updated.seat, '7A');
    assert.equal(updated.aircraft_id, null);
    assert.equal(updated.created_at, flight.created_at);
    const photos = await db.getAllAsync('SELECT * FROM flight_photo WHERE flight_id = ?', [flight.id]);
    assert.equal(photos.length, 1);
  });

  test('borrar vuelo elimina sus fotos; borrar aeronave conserva los vuelos', async () => {
    const { db, repo } = await makeUserRepo();
    const f1 = await repo.createFlight(sclMad);
    const f2 = await repo.createFlight(sclMad);
    await db.runAsync(
      'INSERT INTO flight_photo (id, flight_id, uri, created_at) VALUES (?, ?, ?, ?)',
      ['p1', f1.id, 'file:///foto.jpg', f1.created_at],
    );
    await repo.deleteFlight(f1.id);
    assert.equal((await db.getAllAsync('SELECT * FROM flight_photo', [])).length, 0);

    await repo.deleteAircraft(f2.aircraft_id!);
    assert.equal((await repo.flightById(f2.id))?.aircraft_id, null);
    assert.deepEqual(await repo.counts(), { flights: 1, aircraft: 0 });
  });
});
