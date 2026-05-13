import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { colors, radius, spacing } from '@/components/ui/theme';

type HabitCardProps = {
  actions?: ReactNode;
  category?: string;
  completedToday: boolean;
  name: string;
  reminderTime?: string;
  streak: number;
  target?: string;
};

export function HabitCard({
  actions,
  category,
  completedToday,
  name,
  reminderTime,
  streak,
  target,
}: HabitCardProps) {
  return (
    <Card style={[styles.card, completedToday && styles.completedCard]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.detail}>Frecuencia: diaria</Text>
        </View>
        <View style={[styles.statusPill, completedToday && styles.statusPillDone]}>
          <MaterialIcons
            color={completedToday ? colors.textPrimary : colors.textSecondary}
            name={completedToday ? 'check-circle' : 'radio-button-unchecked'}
            size={17}
          />
          <Text style={[styles.statusText, completedToday && styles.statusTextDone]}>
            {completedToday ? 'Completado' : 'Pendiente'}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <Text style={styles.detail}>Racha actual: {streak} día(s)</Text>
        {category ? <Text style={styles.detail}>Categoría: {category}</Text> : null}
        {target ? <Text style={styles.detail}>Meta: {target}</Text> : null}
        {reminderTime ? <Text style={styles.detail}>Recordatorio: {reminderTime}</Text> : null}
      </View>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  completedCard: {
    borderColor: colors.borderStrong,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 24,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  statusPillDone: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  statusTextDone: {
    color: colors.textPrimary,
  },
  metaGrid: {
    gap: 3,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
