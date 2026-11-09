import { StyleSheet, View } from 'react-native';

import { Card, EmptyState, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useAppData } from '@/data/DataProvider';
import { useFocusQuery } from '@/hooks/use-query';

const km = new Intl.NumberFormat('es', { maximumFractionDigits: 0 });

export default function FlightsScreen() {
  const { user } = useAppData();
  const { data: flights } = useFocusQuery(() => user.listFlights());

  return (
    <Screen title="Vuelos">
      {flights?.length === 0 && (
        <EmptyState
          icon="✈️"
          title="Aún no hay vuelos"
          message="Registra tu primer vuelo, aunque sea de hace muchos años."
        />
      )}
      {flights?.map((f) => (
        <Card key={f.id}>
          <View style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary">
              {[f.airline_name, f.flight_number].filter(Boolean).join(' · ') || 'Vuelo'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {f.flight_date}
            </ThemedText>
          </View>
          <View style={styles.route}>
            <ThemedText style={styles.code}>{f.origin_code}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {km.format(f.distance_km)} km
            </ThemedText>
            <ThemedText style={styles.code}>{f.destination_code}</ThemedText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  route: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  code: { fontFamily: Fonts.mono, fontSize: 28, lineHeight: 34, fontWeight: 700 },
});
