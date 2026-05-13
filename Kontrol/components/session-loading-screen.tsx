import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './ui/theme';

export function SessionLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.textPrimary} />
      <Text style={styles.text}>Cargando sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
