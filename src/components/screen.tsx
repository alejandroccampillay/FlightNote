import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Contenedor común de pantalla: título grande y contenido desplazable. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" accessibilityRole="header">
            {title}
          </ThemedText>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Estado vacío con icono, título y explicación. */
export function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <ThemedText style={styles.emptyIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {message}
      </ThemedText>
    </View>
  );
}

/** Tarjeta con fondo elevado. */
export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

/** Fila etiqueta / valor. */
export function Row({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: { fontSize: 48, lineHeight: 56 },
  center: { textAlign: 'center' },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
