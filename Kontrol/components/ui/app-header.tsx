import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from './theme';
import { useTheme } from './theme-context';

type AppHeaderProps = {
  backLabel?: string;
  description?: string;
  eyebrow?: string;
  onBack?: () => void;
  title: string;
  textColor?: string;
  descriptionColor?: string;
  eyebrowColor?: string;
};

export function AppHeader({
  backLabel,
  description,
  eyebrow,
  onBack,
  title,
  textColor,
  descriptionColor,
  eyebrowColor,
}: AppHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      {onBack && backLabel ? (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <MaterialIcons color={textColor ?? colors.textPrimary} name="arrow-back-ios-new" size={18} />
          <Text style={[styles.backButtonText, { color: colors.textPrimary }, textColor ? { color: textColor } : null]}>{backLabel}</Text>
        </Pressable>
      ) : null}

      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.textSecondary }, eyebrowColor ? { color: eyebrowColor } : null]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: colors.textPrimary }, textColor ? { color: textColor } : null]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }, descriptionColor ? { color: descriptionColor } : null]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.72,
  },
  backButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.semibold,
  },
  eyebrow: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 36,
    fontWeight: typography.weights.heavy,
    lineHeight: 41,
    letterSpacing: typography.letterSpacing.largeTitle,
  },
  description: {
    fontFamily: typography.fontFamily,
    fontSize: 17,
    lineHeight: 25,
  },
});
