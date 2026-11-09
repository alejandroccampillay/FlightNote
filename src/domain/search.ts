// Normalización de texto para búsquedas. Debe coincidir con `fold()` en
// Tools/reference-data/build_reference_db.py (minúsculas, sin diacríticos).

export function foldText(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

export function searchTokens(query: string): string[] {
  return foldText(query)
    .split(/[\s,]+/)
    .filter((t) => t.length > 0);
}

/** Escapa los comodines de LIKE (con `ESCAPE '\'`). */
export function escapeLike(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
