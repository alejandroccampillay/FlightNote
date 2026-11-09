// Horas locales de aeropuerto y duración de vuelos.
// Las horas se guardan "de reloj" (lo que pone la tarjeta de embarque) junto a la zona
// horaria del aeropuerto; el instante absoluto se calcula con Intl.

/** Fecha y hora local "YYYY-MM-DDTHH:mm", sin zona horaria. */
export type LocalDateTime = string;

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export const MAX_FLIGHT_MINUTES = 24 * 60;

export function parseLocalDateTime(value: LocalDateTime) {
  const m = LOCAL_RE.exec(value);
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number) as [number, number, number, number, number];
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

export function formatLocalDateTime(p: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): LocalDateTime {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${String(p.year).padStart(4, '0')}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Hora de reloj que muestra `timeZone` en el instante `epochMs`. */
export function toLocalDateTime(epochMs: number, timeZone: string): LocalDateTime {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(epochMs))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return formatLocalDateTime({
    year: parts.year ?? 1970,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: (parts.hour ?? 0) % 24,
    minute: parts.minute ?? 0,
  });
}

/** Desfase (ms) de `timeZone` respecto a UTC en el instante `epochMs`. */
function offsetMs(epochMs: number, timeZone: string): number {
  const local = parseLocalDateTime(toLocalDateTime(epochMs, timeZone));
  if (!local) return 0;
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  return asUtc - Math.floor(epochMs / 60_000) * 60_000;
}

/** Instante absoluto (ms) de una hora de reloj en `timeZone`, o `null` si no es válida. */
export function localDateTimeToEpoch(value: LocalDateTime, timeZone: string): number | null {
  const p = parseLocalDateTime(value);
  if (!p || !isValidTimeZone(timeZone)) return null;
  const guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  let result = guess - offsetMs(guess, timeZone);
  // Segunda pasada por si el desfase cambia entre la suposición y el resultado (cambio de hora).
  const corrected = guess - offsetMs(result, timeZone);
  if (corrected !== result) result = corrected;
  return result;
}

/**
 * Duración en minutos entre salida y llegada, cada una en la hora local de su aeropuerto.
 * `null` si no es plausible (≤ 0 o > 24 h) o faltan datos.
 */
export function flightDurationMinutes(
  departure: LocalDateTime,
  departureZone: string,
  arrival: LocalDateTime,
  arrivalZone: string,
): number | null {
  const start = localDateTimeToEpoch(departure, departureZone);
  const end = localDateTimeToEpoch(arrival, arrivalZone);
  if (start === null || end === null) return null;
  const minutes = Math.round((end - start) / 60_000);
  return minutes > 0 && minutes <= MAX_FLIGHT_MINUTES ? minutes : null;
}

/** Estimación del tiempo de bloque sin horas: 30 min + crucero a 800 km/h, redondeado a 5 min. */
export function estimatedBlockMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.round((30 + (distanceKm / 800) * 60) / 5) * 5;
}
