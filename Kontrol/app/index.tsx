import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, type Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';

import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen-container';
import { spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';

const blueScreenGradientLight = {
  colors: ['#C8E0FE', '#E2EDFC', '#F4F8FF', '#F4F8FF'],
  locations: [0, 0.18, 0.4, 1],
} as const;

const blueScreenGradientDark = {
  colors: ['#0B1E36', '#0D1520', '#08090C', '#08090C'],
  locations: [0, 0.2, 0.44, 1],
} as const;

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
  const { width: windowWidth } = useWindowDimensions();
  const { isAuthenticated, isLoadingSession } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const cardWidth = windowWidth - 48; // Snapping cards width with side padding

  if (isLoadingSession) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/habits' as Href} />;
  }

  const activeGradient = isDark ? blueScreenGradientDark : blueScreenGradientLight;

  return (
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer scroll={false} style={{ backgroundColor: 'transparent' }} contentStyle={styles.screenContainer}>
        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollableContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Copy block */}
          <View style={styles.copyBlock}>
            <Text style={styles.title}>
              <Text style={styles.boldTitleText}>Kontrol</Text>
            </Text>
            <Text style={styles.description}>
              Registra lo importante en segundos, conserva tus datos en el habitos personalizados y mira cómo crece
              tu constancia sin ruido.
            </Text>
          </View>

          {/* Hero Visualization / Showcase Section */}
          <View style={styles.widgetWrapper}>
            <Card style={styles.previewPanel}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewEyebrow}>HOY</Text>
                  <Text style={styles.previewTitle}>Crea tu ritmo diario</Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>3/4</Text>
                </View>
              </View>

              {/* Checklist */}
              <View style={styles.previewList}>
                <View style={styles.previewItem}>
                  <MaterialIcons color={isDark ? '#0A84FF' : '#007AFF'} name="check-circle" size={20} />
                  <Text style={styles.previewItemText}>Leer 10 páginas</Text>
                </View>
                <View style={styles.previewItem}>
                  <MaterialIcons color={isDark ? '#0A84FF' : '#007AFF'} name="check-circle" size={20} />
                  <Text style={styles.previewItemText}>Caminar 20 minutos</Text>
                </View>
                <View style={[styles.previewItem, styles.previewItemPending]}>
                  <MaterialIcons color={colors.textTertiary} name="radio-button-unchecked" size={20} />
                  <Text style={styles.previewItemPendingText}>Dormir temprano</Text>
                </View>
              </View>

              <View style={styles.widgetDivider} />

              {/* 7-Day Activity Grid */}
              <View style={styles.weekGridSection}>
                <View style={styles.weekGridHeader}>
                  <Text style={styles.weekGridTitle}>Manten tu racha</Text>
                  <Text style={styles.weekGridValue}>
                    <Text style={styles.roundedGridNumber}>3</Text> días seguidos
                  </Text>
                </View>
                <View style={styles.weekGrid}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                    const isDone = idx < 3;
                    const isToday = idx === 3;
                    return (
                      <View key={idx} style={styles.weekDayColumn}>
                        <Text style={[styles.weekDayLabel, isToday && { color: colors.primary, fontWeight: '800' }]}>{day}</Text>
                        <View style={[
                          styles.weekDot,
                          isDone && { backgroundColor: isDark ? '#0A84FF' : '#007AFF' },
                          isToday && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: 'transparent' },
                          !isDone && !isToday && { backgroundColor: colors.surfaceMuted }
                        ]}>
                          {isDone ? (
                            <MaterialIcons name="check" size={10} color="#FFFFFF" />
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.widgetDivider} />

              {/* Daily Consistency Chart */}
              <View style={styles.miniChart}>
                <View style={styles.miniChartHeader}>
                  <Text style={styles.miniChartTitle}>Revisa tu progreso</Text>
                  <Text style={styles.miniChartValue}>
                    <Text style={styles.roundedGridNumber}>75%</Text> de constancia
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  {[40, 60, 50, 90, 75, 60, 80].map((val, idx) => (
                    <View key={idx} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View style={[
                          styles.barFill,
                          { height: `${val}%` },
                          idx === 4 ? { backgroundColor: isDark ? '#0A84FF' : '#007AFF' } : { backgroundColor: colors.textSecondary }
                        ]} />
                      </View>
                      <Text style={[styles.barLabel, idx === 4 && { color: isDark ? '#0A84FF' : '#007AFF', fontWeight: '800' }]}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][idx]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </View>

          {/* Feature Highlights (Horizontal Features Scroll) */}
          <View style={styles.featureHighlightsSection}>
            <Text style={styles.featuresSectionTitle}>Características clave</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + 16}
              decelerationRate="fast"
              snapToAlignment="center"
              contentContainerStyle={styles.featureScrollViewContent}
              style={styles.featureScrollView}
            >
              {values.map((value) => (
                <View key={value.title} style={[styles.featureCard, { width: cardWidth }]}>
                  <View style={styles.featureCardHeader}>
                    <Text style={styles.featureCardTitle}>{value.title}</Text>
                    <View style={[styles.featureCardIconFrame, { backgroundColor: colors.surfaceMuted }]}>
                      <MaterialIcons color={colors.primary} name={value.icon} size={24} />
                    </View>
                  </View>
                  <Text style={styles.featureCardText}>{value.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Sticky footer actions */}
        <View style={styles.footer}>
          <PrimaryButton
            onPress={() => router.push('/(auth)/register' as Href)}
            title="Crear cuenta"
            style={{ backgroundColor: isDark ? '#0A84FF' : '#007AFF' }}
            textColor="#FFFFFF"
          />
          <SecondaryButton onPress={() => router.push('/(auth)/login' as Href)} title="Iniciar sesión" />
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  screenContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    paddingTop: spacing.xl,
    paddingBottom: 160, // Padding to prevent sticky footer from overlap
  },
  widgetWrapper: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  previewPanel: {
    width: '100%',
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewEyebrow: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.heavy,
    letterSpacing: typography.letterSpacing.caption,
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    marginTop: 2,
  },
  previewBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewBadgeText: {
    fontFamily: typography.fontFamilyRound,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.caption,
  },
  previewList: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  previewItemPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  previewItemText: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  previewItemPendingText: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  widgetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  weekGridSection: {
    gap: spacing.md,
  },
  weekGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekGridTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  weekGridValue: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.caption,
  },
  roundedGridNumber: {
    fontFamily: typography.fontFamilyRound,
    fontWeight: typography.weights.semibold,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  weekDayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayLabel: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.caption,
  },
  weekDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniChart: {
    gap: spacing.md,
  },
  miniChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniChartTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  miniChartValue: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.caption,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 50,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: 10,
    height: 40,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
  },
  barLabel: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.caption,
  },
  copyBlock: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  title: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: typography.letterSpacing.largeTitle,
  },
  boldTitleText: {
    fontFamily: typography.fontFamily,
    fontWeight: '900',
  },
  description: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  featureHighlightsSection: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  featuresSectionTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: typography.weights.heavy,
    paddingHorizontal: spacing.xl,
    letterSpacing: typography.letterSpacing.largeTitle,
  },
  featureScrollView: {
    width: '100%',
    overflow: 'visible',
  },
  featureScrollViewContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
    gap: 12,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 28,
    elevation: 5,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  featureCardIconFrame: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  featureCardTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: typography.weights.heavy,
    flex: 1,
    marginRight: 12,
  },
  featureCardText: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: typography.letterSpacing.caption,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.md,
    width: '100%',
  },
});
