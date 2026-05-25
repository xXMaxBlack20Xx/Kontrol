import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';

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
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.card,
        completedToday && [styles.completedCard, { borderColor: colors.border }],
      ]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.detail, { color: colors.textSecondary }]}>Frecuencia: diaria</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            completedToday && [styles.statusPillDone, { backgroundColor: colors.surface, borderColor: colors.borderStrong }],
          ]}>
          <MaterialIcons
            color={completedToday ? colors.textPrimary : colors.textSecondary}
            name={completedToday ? 'check-circle' : 'radio-button-unchecked'}
            size={17}
          />
          <Text
            style={[
              styles.statusText,
              { color: colors.textSecondary },
              completedToday && [styles.statusTextDone, { color: colors.textPrimary }],
            ]}>
            {completedToday ? 'Completado' : 'Pendiente'}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          Racha actual: <Text style={styles.roundedNumber}>{streak}</Text> día(s)
        </Text>
        {category ? <Text style={[styles.detail, { color: colors.textSecondary }]}>Categoría: {category}</Text> : null}
        {target ? <Text style={[styles.detail, { color: colors.textSecondary }]}>Meta: {target}</Text> : null}
        {reminderTime ? (
          <Text style={[styles.detail, { color: colors.textSecondary }]}>
            Recordatorio: <Text style={styles.roundedNumber}>{reminderTime}</Text>
          </Text>
        ) : null}
      </View>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  completedCard: {},
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
    fontFamily: typography.fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.heavy,
    lineHeight: 25,
    letterSpacing: -0.5,
  },
  detail: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  roundedNumber: {
    fontFamily: typography.fontFamilyRound,
    fontWeight: typography.weights.semibold,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  statusPillDone: {},
  statusText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  statusTextDone: {},
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
