import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from './card';
import { radius, spacing, typography } from './theme';
import { useTheme } from './theme-context';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: IconName;
  title: string;
};

export function EmptyState({ action, description, icon = 'inbox', title }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.emptyState}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <View style={[styles.iconFrame, { backgroundColor: colors.surfaceMuted }]}>
          <MaterialIcons color={colors.textPrimary} name={icon} size={22} />
        </View>
      </View>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
});
