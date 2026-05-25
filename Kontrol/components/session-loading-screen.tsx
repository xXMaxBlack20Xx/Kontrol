import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing } from './ui/theme';
import { useTheme } from './ui/theme-context';

export function SessionLoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.textPrimary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>Cargando sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
