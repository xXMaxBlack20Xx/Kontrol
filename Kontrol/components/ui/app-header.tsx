import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './theme';

type AppHeaderProps = {
  backLabel?: string;
  description?: string;
  eyebrow?: string;
  onBack?: () => void;
  title: string;
};

export function AppHeader({ backLabel, description, eyebrow, onBack, title }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack && backLabel ? (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <MaterialIcons color={colors.textPrimary} name="arrow-back-ios-new" size={18} />
          <Text style={styles.backButtonText}>{backLabel}</Text>
        </Pressable>
      ) : null}

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
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
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 41,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
  },
});
