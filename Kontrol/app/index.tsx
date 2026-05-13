import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { BrandMark } from '@/components/ui/brand-mark';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, radius, shadows, spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';

const values = [
  {
    icon: 'lock-outline' as const,
    text: 'Cuenta, sesión y registros viven en este dispositivo.',
    title: 'Datos locales',
  },
  {
    icon: 'insights' as const,
    text: 'Ve qué cumpliste hoy y cómo avanza tu constancia.',
    title: 'Rachas claras',
  },
  {
    icon: 'notifications-none' as const,
    text: 'Programa alertas locales solo cuando aportan valor.',
    title: 'Recordatorios útiles',
  },
];

export default function IndexRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/habits' as Href} />;
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandMark tagline="Hábitos locales" />

        <Card muted style={styles.heroVisual}>
          <Card style={styles.previewPanel}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewEyebrow}>Hoy</Text>
                <Text style={styles.previewTitle}>Ritmo diario</Text>
              </View>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>3/4</Text>
              </View>
            </View>

            <View style={styles.previewList}>
              <View style={styles.previewItem}>
                <MaterialIcons color={colors.textPrimary} name="check-circle" size={20} />
                <Text style={styles.previewItemText}>Leer 10 páginas</Text>
              </View>
              <View style={styles.previewItem}>
                <MaterialIcons color={colors.textPrimary} name="check-circle" size={20} />
                <Text style={styles.previewItemText}>Caminar 20 minutos</Text>
              </View>
              <View style={[styles.previewItem, styles.previewItemPending]}>
                <MaterialIcons color={colors.textTertiary} name="radio-button-unchecked" size={20} />
                <Text style={styles.previewItemPendingText}>Dormir temprano</Text>
              </View>
            </View>
          </Card>
        </Card>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Controla tus hábitos sin complicarte.</Text>
          <Text style={styles.description}>
            Registra lo importante en segundos, conserva tus datos en el iPhone y mira cómo crece
            tu constancia sin ruido.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            icon="arrow-forward"
            onPress={() => router.push('/(auth)/register' as Href)}
            title="Crear cuenta"
          />
          <SecondaryButton onPress={() => router.push('/(auth)/login' as Href)} title="Iniciar sesión" />
        </View>
      </View>

      <View style={styles.valueSection}>
        {values.map((value) => (
          <Card key={value.title} style={styles.valueItem}>
            <View style={styles.iconFrame}>
              <MaterialIcons color={colors.textPrimary} name={value.icon} size={22} />
            </View>
            <View style={styles.valueTextBlock}>
              <Text style={styles.valueTitle}>{value.title}</Text>
              <Text style={styles.valueText}>{value.text}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  hero: {
    gap: spacing.xxl,
  },
  heroVisual: {
    alignItems: 'center',
    padding: 18,
    ...shadows.soft,
  },
  previewPanel: {
    gap: spacing.lg,
    width: '100%',
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewEyebrow: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 48,
    paddingHorizontal: spacing.md,
  },
  previewBadgeText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  previewList: {
    gap: spacing.sm,
  },
  previewItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  previewItemPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  previewItemText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  previewItemPendingText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  copyBlock: {
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 39,
    fontWeight: '800',
    lineHeight: 44,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
  },
  actions: {
    gap: spacing.md,
  },
  valueSection: {
    gap: 10,
    paddingBottom: 4,
  },
  valueItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  valueTextBlock: {
    flex: 1,
    gap: 4,
  },
  valueTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  valueText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
});
