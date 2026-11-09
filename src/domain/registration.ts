// Matrículas de aeronaves ("CC-BGG", "N12345", "JA8089").

/** Clave canónica para detectar duplicados: solo A–Z y 0–9. "cc-bgg" y "CC BGG" → "CCBGG". */
export function registrationKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Forma para mostrar: mayúsculas, sin espacios, conservando los guiones del usuario. */
export function registrationDisplay(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '');
}

/** Prefijo de nacionalidad OACI: "CC-" → "CL". */
export interface RegistrationPrefix {
  prefix: string;
  countryIso: string;
}

interface PrefixEntry {
  raw: string;
  key: string;
  country: string;
}

/** Deduce el país de registro a partir de la matrícula. */
export class RegistrationCountryResolver {
  private readonly byRaw: PrefixEntry[];
  private readonly byKey: PrefixEntry[];

  constructor(prefixes: readonly RegistrationPrefix[]) {
    const entries = prefixes.map((p) => ({
      raw: p.prefix.toUpperCase(),
      key: registrationKey(p.prefix),
      country: p.countryIso,
    }));
    this.byRaw = [...entries].sort((a, b) => b.raw.length - a.raw.length);
    this.byKey = entries.filter((e) => e.key.length > 0).sort((a, b) => b.key.length - a.key.length);
  }

  /**
   * Código ISO del país, o `null` si no se reconoce.
   * Con guion se compara literalmente ("B-H" Hong Kong antes que "B-" China);
   * sin guion, gana el prefijo más largo ("CCBGG" → Chile, no Canadá).
   */
  countryIso(registration: string): string | null {
    const display = registrationDisplay(registration);
    if (!display) return null;
    if (display.includes('-')) {
      return this.byRaw.find((e) => display.startsWith(e.raw))?.country ?? null;
    }
    const key = registrationKey(display);
    return this.byKey.find((e) => key.startsWith(e.key))?.country ?? null;
  }
}
