import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  fontFamilyRound: Platform.select({
    ios: 'round',
    android: 'sans-serif-condensed',
    default: 'System',
  }),
  letterSpacing: {
    largeTitle: -1.0,
    body: 0,
    caption: 0.3,
  },
  weights: {
    regular: '400' as const,
    semibold: '600' as const,
    heavy: '800' as const,
  },
};

export const lightColors = {
  background: '#F7F7F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F5',
  surfacePressed: '#EFEFF0',
  textPrimary: '#111111',
  textSecondary: '#6E6E73',
  textTertiary: '#8A8A8E',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  primary: '#007AFF',
  primaryText: '#FFFFFF',
  successBackground: '#EEF7F1',
  successText: '#246B3D',
  dangerBackground: '#FDECEC',
  dangerText: '#A7352A',
  black: '#000000',
};

export const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceMuted: '#2D2D2D',
  surfacePressed: '#3D3D3D',
  textPrimary: '#FFFFFF',
  textSecondary: '#AEAEB2',
  textTertiary: '#8E8E93',
  border: '#38383A',
  borderStrong: '#48484A',
  primary: '#0A84FF',
  primaryText: '#FFFFFF',
  successBackground: '#1C3A27',
  successText: '#4CD964',
  dangerBackground: '#3D1E1E',
  dangerText: '#FF3B30',
  black: '#000000',
};

export const colors = lightColors;

export const gradients = {
  blueScreenLight: {
    colors: ['#C8E0FE', '#E2EDFC', '#F4F8FF', '#F4F8FF'],
    locations: [0, 0.18, 0.4, 1],
  },
  blueScreenDark: {
    colors: ['#0B1E36', '#0D1520', '#08090C', '#08090C'],
    locations: [0, 0.2, 0.44, 1],
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: colors.black,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
  },
  subtle: {
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
  },
  button: {
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
};
