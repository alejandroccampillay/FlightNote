import FNDomain
import Foundation
import SwiftData

/// Garantiza una sola ficha de aeronave por matrícula.
///
/// SwiftData con CloudKit no admite restricciones de unicidad, así que toda creación de
/// aeronaves debe pasar por aquí. Si aun así aparecen duplicados (p. ej., al sincronizar dos
/// dispositivos), `mergeAllDuplicates()` los fusiona sin perder vuelos.
public struct AircraftRegistry {
    public let context: ModelContext

    public init(context: ModelContext) {
        self.context = context
    }

    /// Busca la aeronave por matrícula, sin importar mayúsculas, guiones ni espacios.
    public func aircraft(registration raw: String) throws -> Aircraft? {
        let key = Registration.normalizedKey(raw)
        guard !key.isEmpty else { return nil }
        var descriptor = FetchDescriptor<Aircraft>(
            predicate: #Predicate { $0.registrationKey == key },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    /// Devuelve la aeronave existente o crea una nueva. `nil` si la matrícula está vacía.
    @discardableResult
    public func findOrCreate(registration raw: String) throws -> Aircraft? {
        guard !Registration.normalizedKey(raw).isEmpty else { return nil }
        if let existing = try aircraft(registration: raw) { return existing }
        let aircraft = Aircraft(registration: raw)
        context.insert(aircraft)
        return aircraft
    }

    /// Asocia un vuelo a la aeronave de esa matrícula (o la desasocia si viene vacía).
    /// Si la ficha no tenía tipo, lo toma del vuelo.
    public func assign(registration raw: String?, to flight: Flight) throws {
        guard let raw, let aircraft = try findOrCreate(registration: raw) else {
            flight.aircraft = nil
            return
        }
        flight.aircraft = aircraft
        if aircraft.typeICAO == nil { aircraft.typeICAO = flight.aircraftTypeICAO }
        if aircraft.manufacturer == nil { aircraft.manufacturer = flight.aircraftManufacturer }
        if aircraft.model == nil { aircraft.model = flight.aircraftModel }
        if aircraft.variant == nil { aircraft.variant = flight.aircraftVariant }
        if aircraft.operatorName == nil { aircraft.operatorName = flight.airlineName }
    }

    /// Grupos de fichas con la misma matrícula normalizada (cada grupo ordenado de más antigua a más nueva).
    public func duplicateGroups() throws -> [[Aircraft]] {
        let all = try context.fetch(FetchDescriptor<Aircraft>(sortBy: [SortDescriptor(\.createdAt)]))
        return Dictionary(grouping: all, by: \.registrationKey)
            .filter { !$0.key.isEmpty && $0.value.count > 1 }
            .sorted { $0.key < $1.key }
            .map(\.value)
    }

    /// Mueve los vuelos de `source` a `target`, completa los datos que falten en `target` y borra `source`.
    public func merge(_ source: Aircraft, into target: Aircraft) {
        guard source.persistentModelID != target.persistentModelID else { return }
        let flights = source.flights ?? []
        for flight in flights {
            flight.aircraft = target
        }
        target.typeICAO = target.typeICAO ?? source.typeICAO
        target.manufacturer = target.manufacturer ?? source.manufacturer
        target.model = target.model ?? source.model
        target.variant = target.variant ?? source.variant
        target.name = target.name ?? source.name
        target.operatorName = target.operatorName ?? source.operatorName
        target.registrationCountryISO = target.registrationCountryISO ?? source.registrationCountryISO
        target.photoData = target.photoData ?? source.photoData
        if let extra = source.notes, !extra.isEmpty {
            target.notes = [target.notes, extra].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: "\n")
        }
        target.updatedAt = .now
        context.delete(source)
    }

    /// Fusiona todos los duplicados en la ficha más antigua de cada grupo. Devuelve cuántas fichas se eliminaron.
    @discardableResult
    public func mergeAllDuplicates() throws -> Int {
        var removed = 0
        for group in try duplicateGroups() {
            guard let target = group.first else { continue }
            for source in group.dropFirst() {
                merge(source, into: target)
                removed += 1
            }
        }
        return removed
    }
}
