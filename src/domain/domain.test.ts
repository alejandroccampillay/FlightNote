/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { convertKm, distanceKm, intermediatePoints } from './geo.ts';
import { RegistrationCountryResolver, registrationDisplay, registrationKey } from './registration.ts';
import { escapeLike, foldText, searchTokens } from './search.ts';
import {
  estimatedBlockMinutes,
  flightDurationMinutes,
  localDateTimeToEpoch,
  toLocalDateTime,
} from './timing.ts';

const SCL = { latitude: -33.393001556396484, longitude: -70.78579711914062 };
const MAD = { latitude: 40.493407, longitude: -3.572249 };
const JFK = { latitude: 40.639447, longitude: -73.779317 };
const LHR = { latitude: 51.470748, longitude: -0.459909 };
const SYD = { latitude: -33.946098, longitude: 151.177002 };
const AKL = { latitude: -37.01199, longitude: 174.786331 };

const near = (actual: number, expected: number, tolerance: number) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≉ ${expected}`);

describe('geo', () => {
  test('distancias de rutas conocidas', () => {
    near(distanceKm(SCL, MAD), 10_719.3, 1);
    near(distanceKm(JFK, LHR), 5_539.8, 1);
    near(distanceKm(SYD, AKL), 2_159.1, 1);
  });

  test('simetría y punto idéntico', () => {
    near(distanceKm(MAD, SCL), distanceKm(SCL, MAD), 1e-9);
    assert.equal(distanceKm(MAD, MAD), 0);
  });

  test('arcos: extremos incluidos y punto medio al norte en JFK→LHR', () => {
    const points = intermediatePoints(SYD, AKL, 32);
    assert.equal(points.length, 32);
    near(points[0]!.latitude, SYD.latitude, 1e-6);
    near(points.at(-1)!.longitude, AKL.longitude, 1e-6);
    const mid = intermediatePoints(JFK, LHR, 3)[1]!;
    assert.ok(mid.latitude > LHR.latitude);
    assert.deepEqual(intermediatePoints(MAD, MAD, 10), [MAD, MAD]);
  });

  test('conversión de unidades', () => {
    near(convertKm(1.609344, 'mi'), 1, 1e-12);
    near(convertKm(1.852, 'nm'), 1, 1e-12);
    assert.equal(convertKm(42, 'km'), 42);
  });
});

describe('matrículas', () => {
  test('clave normalizada', () => {
    for (const [raw, key] of [
      ['CC-BGG', 'CCBGG'],
      ['cc-bgg', 'CCBGG'],
      [' CC BGG ', 'CCBGG'],
      ['N12345', 'N12345'],
      ['ja-8089', 'JA8089'],
      ['EC–MIG', 'ECMIG'],
      ['', ''],
    ] as const) {
      assert.equal(registrationKey(raw), key, raw);
    }
    assert.equal(registrationDisplay(' cc-bgg '), 'CC-BGG');
  });

  const resolver = new RegistrationCountryResolver([
    { prefix: 'C-', countryIso: 'CA' },
    { prefix: 'CC-', countryIso: 'CL' },
    { prefix: 'N', countryIso: 'US' },
    { prefix: 'B-', countryIso: 'CN' },
    { prefix: 'B-H', countryIso: 'HK' },
    { prefix: 'VP-B', countryIso: 'BM' },
    { prefix: 'JA', countryIso: 'JP' },
    { prefix: 'EC-', countryIso: 'ES' },
    { prefix: 'Z-', countryIso: 'ZW' },
    { prefix: 'ZS-', countryIso: 'ZA' },
  ]);

  test('país por prefijo', () => {
    for (const [reg, country] of [
      ['CC-BGG', 'CL'],
      ['CCBGG', 'CL'],
      ['C-FIUA', 'CA'],
      ['CFIUA', 'CA'],
      ['N787AL', 'US'],
      ['B-HNR', 'HK'],
      ['B-1234', 'CN'],
      ['VP-BGA', 'BM'],
      ['JA8089', 'JP'],
      ['ec-mig', 'ES'],
      ['ZS-SNA', 'ZA'],
      ['Z-WPF', 'ZW'],
    ] as const) {
      assert.equal(resolver.countryIso(reg), country, reg);
    }
    assert.equal(resolver.countryIso('XX-123'), null);
    assert.equal(resolver.countryIso('   '), null);
  });
});

describe('horarios', () => {
  test('SCL→MAD nocturno entre zonas horarias', () => {
    // 13:30 en Santiago (UTC−3) → 06:00 del día siguiente en Madrid (UTC+1) = 12 h 30 min.
    assert.equal(
      flightDurationMinutes('2024-03-15T13:30', 'America/Santiago', '2024-03-16T06:00', 'Europe/Madrid'),
      750,
    );
  });

  test('AKL→LAX cruzando la línea de cambio de fecha', () => {
    assert.equal(
      flightDurationMinutes('2025-01-10T19:30', 'Pacific/Auckland', '2025-01-10T10:30', 'America/Los_Angeles'),
      720,
    );
  });

  test('duraciones no plausibles', () => {
    assert.equal(flightDurationMinutes('2024-03-15T13:30', 'Europe/Madrid', '2024-03-15T13:30', 'Europe/Madrid'), null);
    assert.equal(flightDurationMinutes('2024-03-15T13:30', 'Europe/Madrid', '2024-03-17T13:30', 'Europe/Madrid'), null);
    assert.equal(flightDurationMinutes('2024-13-15T13:30', 'Europe/Madrid', '2024-03-16T13:30', 'Europe/Madrid'), null);
    assert.equal(flightDurationMinutes('2024-03-15T13:30', 'Mars/Olympus', '2024-03-16T06:00', 'Europe/Madrid'), null);
  });

  test('ida y vuelta hora local ↔ instante, también en cambio de hora', () => {
    const epoch = localDateTimeToEpoch('1998-07-01T23:05', 'America/Santiago');
    assert.ok(epoch !== null);
    assert.equal(toLocalDateTime(epoch, 'America/Santiago'), '1998-07-01T23:05');
    // Madrid, 31/03/2024: a las 02:00 se adelanta a las 03:00.
    assert.equal(localDateTimeToEpoch('2024-03-31T03:30', 'Europe/Madrid'), Date.UTC(2024, 2, 31, 1, 30));
    assert.equal(localDateTimeToEpoch('2024-03-31T01:30', 'Europe/Madrid'), Date.UTC(2024, 2, 31, 0, 30));
  });

  test('estimación de tiempo de bloque', () => {
    assert.equal(estimatedBlockMinutes(0), 0);
    assert.equal(estimatedBlockMinutes(800), 90);
    assert.equal(estimatedBlockMinutes(10_719) % 5, 0);
  });
});

describe('búsqueda', () => {
  test('normalización', () => {
    assert.equal(foldText('Adolfo Suárez Madrid-Barajas'), 'adolfo suarez madrid-barajas');
    assert.equal(foldText('ZÜRICH'), 'zurich');
    assert.deepEqual(searchTokens('  Santiago,  Chile '), ['santiago', 'chile']);
    assert.equal(escapeLike('a%b_c\\d'), 'a\\%b\\_c\\\\d');
  });
});
