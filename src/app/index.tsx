import { Card, EmptyState, Row, Screen } from '@/components/screen';
import { useAppData } from '@/data/DataProvider';
import { useFocusQuery } from '@/hooks/use-query';

const km = new Intl.NumberFormat('es', { maximumFractionDigits: 0 });

export default function PassportScreen() {
  const { user } = useAppData();
  const { data: flights } = useFocusQuery(() => user.listFlights());

  if (flights === null) return <Screen title="Pasaporte">{null}</Screen>;

  if (flights.length === 0) {
    return (
      <Screen title="Pasaporte">
        <EmptyState
          icon="🌍"
          title="Tu pasaporte está en blanco"
          message="Cuando registres vuelos, aquí verás tus rutas, países y kilómetros."
        />
      </Screen>
    );
  }

  const totalKm = flights.reduce((sum, f) => sum + f.distance_km, 0);
  const countries = new Set(flights.flatMap((f) => [f.origin_country, f.destination_country]).filter(Boolean));
  const airports = new Set(flights.flatMap((f) => [f.origin_code, f.destination_code]));

  return (
    <Screen title="Pasaporte">
      <Card>
        <Row label="Vuelos" value={String(flights.length)} />
        <Row label="Distancia" value={`${km.format(totalKm)} km`} />
        <Row label="Aeropuertos" value={String(airports.size)} />
        <Row label="Países" value={String(countries.size)} />
      </Card>
    </Screen>
  );
}
