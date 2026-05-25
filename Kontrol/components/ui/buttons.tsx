import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { radius, shadows, spacing, typography } from './theme';
import { useTheme } from './theme-context';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  compact?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
  textColor?: string;
};

type SecondaryButtonProps = ButtonProps & {
  tone?: 'default' | 'danger';
};

export function PrimaryButton({
  compact = false,
  disabled,
  fullWidth = true,
  icon,
  loading = false,
  style,
  title,
  textColor,
  ...pressableProps
}: ButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        { backgroundColor: colors.primary },
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <>
          <ActivityIndicator color={textColor || colors.primaryText} />
          <Text style={[styles.primaryButtonText, { color: textColor || colors.primaryText }]}>{title}</Text>
        </>
      ) : (
        <>
          {icon ? <MaterialIcons color={textColor || colors.primaryText} name={icon} size={20} /> : null}
          <Text style={[styles.primaryButtonText, { color: textColor || colors.primaryText }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  compact = false,
  disabled,
  fullWidth = true,
  icon,
  loading = false,
  style,
  title,
  tone = 'default',
  ...pressableProps
}: SecondaryButtonProps) {
  const { colors } = useTheme();
  const contentColor = tone === 'danger' ? colors.dangerText : colors.textPrimary;

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
        },
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && [styles.secondaryPressed, { backgroundColor: colors.surfacePressed }],
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <>
          <ActivityIndicator color={contentColor} />
          <Text style={[styles.secondaryButtonText, { color: contentColor }]}>{title}</Text>
        </>
      ) : (
        <>
          {icon ? <MaterialIcons color={contentColor} name={icon} size={20} /> : null}
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }, tone === 'danger' && { color: colors.dangerText }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function DestructiveButton({
  compact = false,
  disabled,
  fullWidth = true,
  icon,
  loading = false,
  style,
  title,
  ...pressableProps
}: ButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.destructiveButton,
        { backgroundColor: colors.dangerText },
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <>
          <ActivityIndicator color={colors.primaryText} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>{title}</Text>
        </>
      ) : (
        <>
          {icon ? <MaterialIcons color={colors.primaryText} name={icon} size={20} /> : null}
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  compactButton: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  selfStart: {
    alignSelf: 'flex-start',
  },
  primaryButton: {
    ...shadows.button,
  },
  destructiveButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  secondaryPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.semibold,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.semibold,
  },
});
