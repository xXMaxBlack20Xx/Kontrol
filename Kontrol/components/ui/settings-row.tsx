import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from './theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type SettingsRowProps = {
  detail?: string;
  icon: IconName;
  onPress?: () => void;
  title: string;
  tone?: 'default' | 'danger';
};

export function SettingsRow({ detail, icon, onPress, title, tone = 'default' }: SettingsRowProps) {
  const contentColor = tone === 'danger' ? colors.dangerText : colors.textPrimary;
  const rowContent = (
    <>
      <View style={styles.iconFrame}>
        <MaterialIcons color={contentColor} name={icon} size={22} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, tone === 'danger' && styles.dangerText]}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {onPress ? <MaterialIcons color={colors.textTertiary} name="chevron-right" size={22} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {rowContent}
      </Pressable>
    );
  }

  return <View style={styles.row}>{rowContent}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
  },
  pressed: {
    opacity: 0.72,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  dangerText: {
    color: colors.dangerText,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
