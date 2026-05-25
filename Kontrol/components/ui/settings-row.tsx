import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from './theme';
import { useTheme } from './theme-context';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type SettingsRowProps = {
  accessibilityLabel?: string;
  detail?: string;
  icon: IconName;
  onPress?: () => void;
  title: string;
  tone?: 'default' | 'danger';
  textColor?: string;
  detailColor?: string;
  iconBgColor?: string;
  chevronColor?: string;
  showChevron?: boolean;
};

export function SettingsRow({
  accessibilityLabel,
  detail,
  icon,
  onPress,
  title,
  tone = 'default',
  textColor,
  detailColor,
  iconBgColor,
  chevronColor,
  showChevron = true,
}: SettingsRowProps) {
  const { colors } = useTheme();

  const contentColor = tone === 'danger' ? colors.dangerText : (textColor ?? colors.textPrimary);
  const hasChevron = onPress && showChevron;

  const rowContent = (
    <>
      <View style={[styles.iconFrame, { backgroundColor: colors.surfaceMuted }, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
        <MaterialIcons color={contentColor} name={icon} size={22} />
      </View>
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
            tone === 'danger' ? { color: colors.dangerText } : (textColor ? { color: textColor } : null),
          ]}>
          {title}
        </Text>
        {detail ? (
          <Text style={[styles.detail, { color: colors.textSecondary }, detailColor ? { color: detailColor } : null]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {hasChevron ? <MaterialIcons color={chevronColor ?? colors.textTertiary} name="chevron-right" size={22} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {rowContent}
      </Pressable>
    );
  }

  return <View accessibilityLabel={accessibilityLabel ?? title} style={styles.row}>{rowContent}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.72,
  },
  iconFrame: {
    alignItems: 'center',
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
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
  },
});
