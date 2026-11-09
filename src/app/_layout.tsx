import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { ActivityIndicator, StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { DataProvider } from '@/data/DataProvider';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DataProvider
        fallback={
          <View style={[styles.center, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.accent} />
          </View>
        }
        renderError={(error) => (
          <View style={[styles.center, { backgroundColor: colors.background }]}>
            <ThemedText type="smallBold">No se pudieron abrir los datos</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {error.message}
            </ThemedText>
          </View>
        )}>
        <NativeTabs
          backgroundColor={colors.background}
          indicatorColor={colors.backgroundSelected}
          labelStyle={{ selected: { color: colors.accent } }}
          iconColor={{ selected: colors.accent }}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Pasaporte</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="globe.americas.fill" md="public" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="flights">
            <NativeTabs.Trigger.Label>Vuelos</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="airplane" md="flight" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="fleet">
            <NativeTabs.Trigger.Label>Mi flota</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="airplane.circle" md="connecting_airports" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="stats">
            <NativeTabs.Trigger.Label>Estadísticas</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" md="bar_chart" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
            <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
          </NativeTabs.Trigger>
        </NativeTabs>
      </DataProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  message: { textAlign: 'center' },
});
