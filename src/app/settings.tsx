import Constants from 'expo-constants';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Card, Row, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { airportCode } from '@/domain/types';
import { useAppData } from '@/data/DataProvider';
import { useFocusQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';

const number = new Intl.NumberFormat('es');

export default function SettingsScreen() {
  const { reference, user } = useAppData();
  const theme = useTheme();
  const { data: stats, error } = useFocusQuery(() => reference.statistics());
  const { data: counts, reload: reloadCounts } = useFocusQuery(() => user.counts());

  // Fase 1: comprueba de punta a punta que la base de referencia y la del usuario funcionan.
  async function addSampleFlight() {
    try {
      const [scl, mad, airline, type] = await Promise.all([
        reference.airport('SCL'),
        reference.airport('MAD'),
        reference.airline('LA'),
        reference.aircraftType('B789'),
      ]);
      if (!scl || !mad) throw new Error('No se encontraron SCL o MAD en la base de referencia.');
      await user.createFlight({
        flight_date: '2024-03-15',
        airline_name: airline?.name ?? 'LATAM Airlines',
        airline_iata: airline?.iata ?? 'LA',
        airline_icao: airline?.icao ?? null,
        flight_number: 'LA800',
        origin_code: airportCode(scl),
        origin_name: scl.name,
        origin_city: scl.city,
        origin_country: scl.countryIso,
        origin_lat: scl.coordinate.latitude,
        origin_lon: scl.coordinate.longitude,
        origin_tz: scl.timeZone,
        destination_code: airportCode(mad),
        destination_name: mad.name,
        destination_city: mad.city,
        destination_country: mad.countryIso,
        destination_lat: mad.coordinate.latitude,
        destination_lon: mad.coordinate.longitude,
        destination_tz: mad.timeZone,
        aircraft_type_icao: type?.icao ?? 'B789',
        aircraft_manufacturer: type?.manufacturer ?? 'Boeing',
        aircraft_model: type?.model ?? '787',
        aircraft_variant: type?.variant ?? '787-9',
        registration: 'CC-BGG',
      });
      reloadCounts();
      Alert.alert('Vuelo de ejemplo creado', 'LA800 SCL → MAD con la matrícula CC-BGG.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Screen title="Ajustes">
      <ThemedText type="smallBold">Base de datos aeronáutica</ThemedText>
      <Card>
        {stats ? (
          <>
            <Row label="Aeropuertos" value={number.format(stats.airports)} testID="reference-airport-count" />
            <Row label="Aerolíneas" value={number.format(stats.airlines)} />
            <Row label="Tipos de aeronave" value={number.format(stats.aircraftTypes)} />
            <Row label="Generada" value={stats.builtAt.slice(0, 10)} />
          </>
        ) : (
          <ThemedText type="small" themeColor={error ? 'danger' : 'textSecondary'}>
            {error ? `No se pudo leer la base: ${error.message}` : 'Cargando…'}
          </ThemedText>
        )}
      </Card>

      <ThemedText type="smallBold">Tus datos</ThemedText>
      <Card>
        <Row label="Vuelos" value={String(counts?.flights ?? '—')} />
        <Row label="Aeronaves" value={String(counts?.aircraft ?? '—')} />
        <Pressable
          accessibilityRole="button"
          onPress={addSampleFlight}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            Añadir vuelo de ejemplo (LA800)
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          Tus vuelos se guardan solo en este teléfono. Sin cuenta, sin publicidad y sin seguimiento.
        </ThemedText>
      </Card>

      <ThemedText type="smallBold">Licencias de datos</ThemedText>
      <Card>
        <ThemedText type="small">Aeropuertos y países: OurAirports (dominio público).</ThemedText>
        <ThemedText type="small">Aerolíneas: OpenFlights (Open Database License).</ThemedText>
        <ThemedText type="small">Zonas horarias: timezone-boundary-builder (Open Database License).</ThemedText>
      </Card>

      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        FlightNote {Constants.expoConfig?.version ?? ''}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, paddingVertical: Spacing.three, alignItems: 'center', marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF' },
  version: { textAlign: 'center' },
});
