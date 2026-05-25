import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { radius, spacing, typography } from './theme';
import { useTheme } from './theme-context';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type TextInputFieldProps = TextInputProps & {
  icon?: IconName;
  label: string;
};

type FeedbackMessageProps = {
  message: string;
  type?: 'error' | 'success' | 'info';
};

type SelectPillProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function TextInputField({ icon, label, style, ...textInputProps }: TextInputFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        {icon ? <MaterialIcons color={colors.textTertiary} name={icon} size={20} /> : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.textPrimary }, style]}
          {...textInputProps}
        />
      </View>
    </View>
  );
}

export function FeedbackMessage({ message, type = 'error' }: FeedbackMessageProps) {
  const { colors } = useTheme();

  const feedbackStyles = {
    error: {
      backgroundColor: colors.dangerBackground,
      color: colors.dangerText,
    },
    success: {
      backgroundColor: colors.successBackground,
      color: colors.successText,
    },
    info: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      color: colors.textSecondary,
    },
  };

  return (
    <Text
      style={[
        styles.feedback,
        feedbackStyles[type],
      ]}>
      {message}
    </Text>
  );
}

export function SelectPill({ label, onPress, selected }: SelectPillProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectPill,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
        },
        selected && [styles.selectPillSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.selectPillText, { color: colors.textPrimary }, selected && { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

export function FormGroup({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.formGroup, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 17,
    minHeight: 52,
  },
  feedback: {
    borderRadius: radius.md,
    fontSize: 15,
    lineHeight: 20,
    padding: spacing.md,
  },
  selectPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  selectPillSelected: {},
  selectPillText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
    letterSpacing: -0.3,
  },
  pressed: {
    opacity: 0.72,
  },
  formGroup: {
    gap: spacing.lg,
  },
});
