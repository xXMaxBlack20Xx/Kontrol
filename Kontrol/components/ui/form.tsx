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

import { colors, radius, spacing } from './theme';

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
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        {icon ? <MaterialIcons color={colors.textTertiary} name={icon} size={20} /> : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, style]}
          {...textInputProps}
        />
      </View>
    </View>
  );
}

export function FeedbackMessage({ message, type = 'error' }: FeedbackMessageProps) {
  return (
    <Text
      style={[
        styles.feedback,
        type === 'error' && styles.feedbackError,
        type === 'success' && styles.feedbackSuccess,
        type === 'info' && styles.feedbackInfo,
      ]}>
      {message}
    </Text>
  );
}

export function SelectPill({ label, onPress, selected }: SelectPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectPill,
        selected && styles.selectPillSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.selectPillText, selected && styles.selectPillTextSelected]}>{label}</Text>
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
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    color: colors.textPrimary,
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
  feedbackError: {
    backgroundColor: colors.dangerBackground,
    color: colors.dangerText,
  },
  feedbackSuccess: {
    backgroundColor: colors.successBackground,
    color: colors.successText,
  },
  feedbackInfo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.textSecondary,
  },
  selectPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  selectPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectPillText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  selectPillTextSelected: {
    color: colors.primaryText,
  },
  pressed: {
    opacity: 0.72,
  },
  formGroup: {
    gap: spacing.lg,
  },
});
