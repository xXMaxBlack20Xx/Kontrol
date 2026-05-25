import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { radius, shadows, spacing, typography } from '@/components/ui/theme';
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
  const isSuccessStatus = completedToday || statusTone === 'success';

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
        },
      ]}>
      {coverPhotoUrl ? <Image source={{ uri: coverPhotoUrl }} style={styles.coverImage} /> : null}

      <View style={styles.header}>
        <View style={[styles.iconFrame, { backgroundColor: `${accentColor}1F` }]}>
          <MaterialIcons color={accentColor} name={iconName} size={22} />
        </View>

        <View style={styles.titleBlock}>
          <Text numberOfLines={2} style={[styles.name, { color: colors.textPrimary }]}>
            {name}
          </Text>
          <View style={styles.metaInline}>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              {formatHabitDays(daysOfWeek)}
              {category ? `  •  ${category}` : ''}
              {streak > 0 ? `  •  🔥 ${streak} ${streak === 1 ? 'día' : 'días'}` : ''}
            </Text>
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
            name={completedToday ? 'check' : statusTone === 'muted' ? 'event-busy' : 'add'}
            size={22}
          />
        </View>
      </View>

      {scheduleDescription ? (
        <Text style={[styles.scheduleDescription, { color: colors.textSecondary }]}>
          {scheduleDescription}
        </Text>
      ) : null}

      {target || reminderTime || (subcategories && subcategories.length > 0) ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.metaGrid}
          contentContainerStyle={styles.metaGridContent}>
          {target ? (
            <View style={[styles.metaPill, { backgroundColor: `${accentColor}1A` }]}>
              <MaterialIcons color={accentColor} name="flag" size={14} />
              <Text numberOfLines={1} style={[styles.metaPillText, { color: accentColor }]}>
                {target}
              </Text>
            </View>
          ) : null}
          {reminderTime ? (
            <View style={[styles.metaPill, { backgroundColor: `${accentColor}1A` }]}>
              <MaterialIcons color={accentColor} name="notifications-none" size={14} />
              <Text style={[styles.metaPillText, { color: accentColor }]}>
                Recordatorio {reminderTime}
              </Text>
            </View>
          ) : null}
          {subcategories?.slice(0, 3).map((subcategory) => (
            <View key={subcategory} style={[styles.metaPill, { backgroundColor: `${accentColor}1A` }]}>
              <Text numberOfLines={1} style={[styles.metaPillText, { color: accentColor }]}>
                {subcategory}
              </Text>
            </View>
          ))}
          {subcategories && subcategories.length > 3 ? (
            <View style={[styles.metaPill, { backgroundColor: `${accentColor}1A` }]}>
              <Text style={[styles.metaPillText, { color: accentColor }]}>
                +{subcategories.length - 3}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {actions ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actions}
          contentContainerStyle={styles.actionsContent}>
          {actions}
        </ScrollView>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 0,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.soft,
    elevation: 4,
  },
  coverImage: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    height: 150,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
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
    gap: 4,
  },
  name: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  metaInline: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detail: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    width: 44,
    justifyContent: 'center',
  },
  scheduleDescription: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  metaGrid: {
    flexDirection: 'row',
  },
  metaGridContent: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 12,
  },
  metaPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaPillText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  actionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: 16,
  },
});
