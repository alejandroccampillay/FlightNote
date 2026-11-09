# ADR 0002 — Estructura técnica de la Fase 1

- **Fecha:** 2026-11-08
- **Estado:** aceptada

## Decisiones

1. **Un único paquete SPM con varios módulos (`FlightNoteKit`)** en lugar de un paquete por módulo. Da la misma separación con menos configuración.

   | Módulo | Contenido | Dependencias |
   |---|---|---|
   | `FNDomain` | Lógica pura y tipos de valor | Ninguna |
   | `FNReferenceData` | SQLite de solo lectura | FNDomain + GRDB |
   | `FNPersistence` | SwiftData | FNDomain |

   Los módulos futuros (FNMapping, FNImportExport, FNDesignSystem, FNFeatures) se añadirán al mismo paquete.

2. **Modo de lenguaje Swift:**
   - `FNDomain` y `FNReferenceData` usan Swift 6, con comprobación estricta de concurrencia.
   - `FNPersistence`, la app y los tests de UI usan el modo Swift 5. Sin Mac, cada error de compilación cuesta un ciclo completo de CI, y SwiftData sigue generando avisos de `Sendable` en Swift 6. Se revisará al estabilizar la Fase 2.

3. **Esquema SwiftData versionado desde el día 1** (`SchemaV1` + `FlightNoteMigrationPlan`). Todo cambio futuro añade `SchemaV2` y una etapa de migración, así no se pierden datos al actualizar.

4. **Compatibilidad con CloudKit sin activarlo:**
   - valores por defecto en todas las propiedades;
   - relaciones opcionales;
   - sin `@Attribute(.unique)`;
   - enums guardados como `String`.

5. **Snapshot del aeropuerto dentro del vuelo:** código, nombre, ciudad, país, coordenadas y zona horaria. El historial es independiente de la versión de la base de referencia.

6. **Tipo de aeronave en el vuelo y en la ficha:** el vuelo guarda el tipo aunque no haya matrícula. Al asociar una matrícula, la ficha toma el tipo del vuelo si no tenía uno.

7. **Base de referencia como SQLite incluido en la app y generado por script** (`Tools/reference-data`). Se versiona el `.sqlite` generado (1,8 MB) para que la compilación no dependa de descargas.

8. **Búsqueda con `LIKE` sobre una columna normalizada** (`search_text`), sin FTS. Con unos 6.000 registros por tabla es suficiente. FTS5 se considerará si hace falta.

9. **Pruebas de UI con argumentos de lanzamiento:**
   - `-ui-testing`: almacén en memoria.
   - `-ui-light` / `-ui-dark`: fuerzan la apariencia para generar capturas en ambos modos.
