import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from './card';
import { colors, radius, spacing } from './theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: IconName;
  title: string;
};

export function EmptyState({ action, description, icon = 'inbox', title }: EmptyStateProps) {
  return (
    <Card style={styles.emptyState}>
      <View style={styles.iconFrame}>
        <MaterialIcons color={colors.textPrimary} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    gap: spacing.md,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
});
