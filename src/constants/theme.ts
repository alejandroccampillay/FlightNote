/**
 * Paleta propia de FlightNote: "papel de pasaporte" en claro y grafito en oscuro, con acento verde
 * pasaporte. Provisional hasta la fase de diseño (Fase 7).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1F1D',
    background: '#F7F4EE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E1D6',
    textSecondary: '#6B6F6A',
    accent: '#1F6F5C',
    danger: '#B3261E',
  },
  dark: {
    text: '#F2F1EC',
    background: '#121413',
    backgroundElement: '#1C1F1E',
    backgroundSelected: '#2A2E2C',
    textSecondary: '#A3A8A4',
    accent: '#4FB39A',
    danger: '#F2B8B5',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
