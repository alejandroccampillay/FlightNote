import { StyleSheet } from 'react-native';

import { Card, EmptyState, Row, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useAppData } from '@/data/DataProvider';
import { useFocusQuery } from '@/hooks/use-query';

const km = new Intl.NumberFormat('es', { maximumFractionDigits: 0 });

export default function FleetScreen() {
  const { user } = useAppData();
  const { data: fleet } = useFocusQuery(() => user.listAircraft());

  return (
    <Screen title="Mi flota">
      {fleet?.length === 0 && (
        <EmptyState
          icon="🛩️"
          title="Tu flota está vacía"
          message="Cada matrícula que vueles tendrá aquí su propia ficha con todos sus vuelos."
        />
      )}
      {fleet?.map((a) => (
        <Card key={a.id}>
          <ThemedText style={styles.registration}>{a.registration}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[a.manufacturer, a.variant ?? a.model].filter(Boolean).join(' ') || 'Tipo desconocido'}
            {a.operator_name ? ` · ${a.operator_name}` : ''}
          </ThemedText>
          <Row label="Vuelos" value={String(a.flight_count)} />
          <Row label="Distancia" value={`${km.format(a.total_km)} km`} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  registration: { fontFamily: Fonts.mono, fontSize: 24, lineHeight: 30, fontWeight: 700 },
});
