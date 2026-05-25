import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { formatHabitDays } from '@/features/habits/habit';

type HabitCardProps = {
  actions?: ReactNode;
  category?: string;
  color?: string;
  completedToday: boolean;
  coverPhotoUrl?: string;
  daysOfWeek?: number[];
  icon?: string;
  name: string;
  reminderTime?: string;
  scheduleDescription?: string;
  statusLabel?: string;
  statusTone?: 'default' | 'muted' | 'success';
  streak: number;
  subcategories?: string[];
  target?: string;
};

type IconName = ComponentProps<typeof MaterialIcons>['name'];

function isHexColor(value?: string): value is string {
  return Boolean(value && /^#[0-9A-Fa-f]{6}$/.test(value));
}

function isMaterialIconName(value?: string): value is IconName {
  return Boolean(value && value in MaterialIcons.glyphMap);
}

export function HabitCard({
  actions,
  category,
  color,
  completedToday,
  coverPhotoUrl,
  daysOfWeek,
  icon,
  name,
  reminderTime,
  scheduleDescription,
  statusLabel,
  statusTone = 'default',
  streak,
  subcategories,
  target,
}: HabitCardProps) {
  const { colors } = useTheme();
  const accentColor = isHexColor(color) ? color : completedToday ? '#34C759' : colors.primary;
  const iconName = isMaterialIconName(icon) ? icon : completedToday ? 'check' : 'track-changes';
  const resolvedStatusLabel = statusLabel ?? (completedToday ? 'Completado' : 'Pendiente');
  const isSuccessStatus = completedToday || statusTone === 'success';

  return (
    <Card
      style={[
        styles.card,
        { borderColor: completedToday ? accentColor : colors.border },
      ]}>
      {coverPhotoUrl ? <Image source={{ uri: coverPhotoUrl }} style={styles.coverImage} /> : null}

      <View style={styles.header}>
        <View style={[styles.iconFrame, { backgroundColor: `${accentColor}1F` }]}>
          <MaterialIcons color={accentColor} name={iconName} size={22} />
        </View>

        <View style={styles.titleBlock}>
          <Text numberOfLines={2} style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
          <View style={styles.metaInline}>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>{formatHabitDays(daysOfWeek)}</Text>
            {category ? <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text> : null}
            {category ? <Text style={[styles.detail, { color: colors.textSecondary }]}>{category}</Text> : null}
          </View>
        </View>

        <View
            style={[
              styles.statusPill,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            isSuccessStatus && { backgroundColor: `${accentColor}1F`, borderColor: accentColor },
          ]}>
          <MaterialIcons
            color={isSuccessStatus ? accentColor : colors.textSecondary}
            name={completedToday ? 'check-circle' : statusTone === 'muted' ? 'event-busy' : 'radio-button-unchecked'}
            size={17}
          />
          <Text
            style={[
              styles.statusText,
              { color: colors.textSecondary },
              isSuccessStatus && { color: accentColor },
            ]}>
            {resolvedStatusLabel}
          </Text>
        </View>
      </View>

      {scheduleDescription ? (
        <Text style={[styles.scheduleDescription, { color: colors.textSecondary }]}>{scheduleDescription}</Text>
      ) : null}

      <View style={styles.metaGrid}>
        <View style={[styles.metricTile, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{streak}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>racha</Text>
        </View>
        {target ? (
          <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
            <MaterialIcons color={colors.textSecondary} name="flag" size={16} />
            <Text numberOfLines={1} style={[styles.detail, { color: colors.textSecondary }]}>{target}</Text>
          </View>
        ) : null}
        {reminderTime ? (
          <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
            <MaterialIcons color={colors.textSecondary} name="notifications-none" size={16} />
            <Text style={[styles.detail, { color: colors.textSecondary }]}>Recordatorio {reminderTime}</Text>
          </View>
        ) : null}
        {subcategories?.slice(0, 3).map((subcategory) => (
          <View key={subcategory} style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
            <Text numberOfLines={1} style={[styles.detail, { color: colors.textSecondary }]}>{subcategory}</Text>
          </View>
        ))}
        {subcategories && subcategories.length > 3 ? (
          <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>+{subcategories.length - 3}</Text>
          </View>
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
  coverImage: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    height: 150,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 46,
    justifyContent: 'center',
    width: 46,
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
  metaInline: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
  },
  detail: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
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
  statusText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  scheduleDescription: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  metaGrid: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    alignItems: 'center',
    borderRadius: radius.lg,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricValue: {
    fontFamily: typography.fontFamilyRound,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    lineHeight: 25,
  },
  metricLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  metaPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
