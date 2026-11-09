import { EmptyState, Screen } from '@/components/screen';

export default function StatsScreen() {
  return (
    <Screen title="Estadísticas">
      <EmptyState
        icon="📊"
        title="Sin estadísticas todavía"
        message="Récords, rankings y logros se calcularán automáticamente con tu historial."
      />
    </Screen>
  );
}
