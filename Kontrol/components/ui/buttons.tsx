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

import { colors, radius, shadows, spacing } from './theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  compact?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
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
  ...pressableProps
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <>
          {icon ? <MaterialIcons color={colors.primaryText} name={icon} size={20} /> : null}
          <Text style={styles.primaryButtonText}>{title}</Text>
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
  const contentColor = tone === 'danger' ? colors.dangerText : colors.textPrimary;

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && styles.secondaryPressed,
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon ? <MaterialIcons color={contentColor} name={icon} size={20} /> : null}
          <Text style={[styles.secondaryButtonText, tone === 'danger' && styles.dangerText]}>{title}</Text>
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
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.destructiveButton,
        compact && styles.compactButton,
        fullWidth ? styles.fullWidth : styles.selfStart,
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}
      {...pressableProps}>
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <>
          {icon ? <MaterialIcons color={colors.primaryText} name={icon} size={20} /> : null}
          <Text style={styles.primaryButtonText}>{title}</Text>
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
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  destructiveButton: {
    backgroundColor: colors.dangerText,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  secondaryPressed: {
    backgroundColor: colors.surfacePressed,
    opacity: 0.92,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  dangerText: {
    color: colors.dangerText,
  },
});
