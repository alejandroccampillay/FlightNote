// Tipos del dominio compartidos por datos y pantallas.
import type { GeoCoordinate } from './geo.ts';

export const CABIN_CLASSES = ['economy', 'premiumEconomy', 'business', 'first', 'other'] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];

export const SEAT_POSITIONS = ['window', 'middle', 'aisle'] as const;
export type SeatPosition = (typeof SEAT_POSITIONS)[number];

export const TRAVEL_REASONS = ['leisure', 'business', 'crew', 'other'] as const;
export type TravelReason = (typeof TRAVEL_REASONS)[number];

/** Aeropuerto de la base de referencia. */
export interface AirportInfo {
  id: number;
  ident: string;
  iata: string | null;
  icao: string | null;
  name: string;
  city: string | null;
  countryIso: string;
  region: string | null;
  /** AF, AN, AS, EU, NA, OC, SA */
  continent: string;
  coordinate: GeoCoordinate;
  elevationFt: number | null;
  timeZone: string | null;
  /** large, medium, small, seaplane_base */
  kind: string;
  hasScheduledService: boolean;
}

export function airportCode(a: Pick<AirportInfo, 'iata' | 'icao' | 'ident'>): string {
  return a.iata ?? a.icao ?? a.ident;
}

export interface AirlineInfo {
  id: number;
  name: string;
  alias: string | null;
  iata: string | null;
  icao: string | null;
  callsign: string | null;
  countryIso: string | null;
  isActive: boolean;
}

export interface AircraftTypeInfo {
  icao: string;
  manufacturer: string;
  model: string;
  variant: string;
  /** narrowbody, widebody, regional, turboprop, other */
  category: string;
}
