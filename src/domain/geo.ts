// Cálculos sobre la esfera terrestre (ruta ortodrómica o de círculo máximo).
// Código puro: sin dependencias de React Native, se prueba con `node --test`.

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/** Radio medio terrestre (IUGG), en km. */
export const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Distancia ortodrómica entre dos puntos, en km (fórmula del haversine). */
export function distanceKm(a: GeoCoordinate, b: GeoCoordinate): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Puntos de la ruta ortodrómica, incluidos los extremos. Sirve para dibujar arcos en
 * mapas planos. Con puntos iguales o antipodales devuelve solo los extremos.
 */
export function intermediatePoints(
  a: GeoCoordinate,
  b: GeoCoordinate,
  count: number,
): GeoCoordinate[] {
  const n = Math.max(count, 2);
  const d = distanceKm(a, b) / EARTH_RADIUS_KM; // distancia angular
  const sinD = Math.sin(d);
  if (d < 1e-9 || Math.abs(sinD) < 1e-9) return [a, b];

  const lat1 = toRad(a.latitude);
  const lon1 = toRad(a.longitude);
  const lat2 = toRad(b.latitude);
  const lon2 = toRad(b.longitude);
  const points: GeoCoordinate[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const fa = Math.sin((1 - f) * d) / sinD;
    const fb = Math.sin(f * d) / sinD;
    const x = fa * Math.cos(lat1) * Math.cos(lon1) + fb * Math.cos(lat2) * Math.cos(lon2);
    const y = fa * Math.cos(lat1) * Math.sin(lon1) + fb * Math.cos(lat2) * Math.sin(lon2);
    const z = fa * Math.sin(lat1) + fb * Math.sin(lat2);
    points.push({
      latitude: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      longitude: toDeg(Math.atan2(y, x)),
    });
  }
  return points;
}

export type DistanceUnit = 'km' | 'mi' | 'nm';

export function convertKm(km: number, unit: DistanceUnit): number {
  switch (unit) {
    case 'km':
      return km;
    case 'mi':
      return km / 1.609344;
    case 'nm':
      return km / 1.852;
  }
}
