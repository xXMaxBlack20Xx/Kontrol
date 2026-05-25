import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LinearGradient } from 'expo-linear-gradient';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { type ProgressPeriod, type ProgressSummary } from '@/features/habits/completion';
import { getRemoteProgress } from '@/features/habits/remote-progress-service';

export default function ProgressScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [period, setPeriod] = useState<ProgressPeriod>('weekly');
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      if (!user) {
        setProgress(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        const remoteProgress = await getRemoteProgress(period);

        if (isMounted) {
          setProgress(remoteProgress);
        }
      } catch {
        if (isMounted) {
          setProgress(null);
          setMessage('No se pudo cargar el progreso desde Kontrol. Intenta nuevamente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [period, user]);

  if (!user) {
    return <SessionLoadingScreen />;
  }

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;

  return (
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer
        style={{ backgroundColor: 'transparent' }}
        contentStyle={styles.content}
        edges={['top']}
      >
      <AppHeader
        description="Consulta tus avances con indicadores simples calculados desde tus registros en Kontrol."
        title="Progreso"
      />

      <View style={styles.periodSelector}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPeriod('weekly')}
          style={({ pressed }) => [
            styles.periodButton,
            period === 'weekly' && styles.periodButtonActive,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.periodButtonText, period === 'weekly' && styles.periodButtonTextActive]}>
            Semanal
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPeriod('monthly')}
          style={({ pressed }) => [
            styles.periodButton,
            period === 'monthly' && styles.periodButtonActive,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.periodButtonText, period === 'monthly' && styles.periodButtonTextActive]}>
            Mensual
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.loadingText}>Cargando progreso...</Text>
        </View>
      ) : null}

      {message ? <FeedbackMessage message={message} /> : null}

      {progress ? (
        <>
          <View style={styles.indicatorGrid}>
            <Card style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.completionRate}%</Text>
              <Text style={styles.indicatorLabel}>Cumplimiento</Text>
            </Card>
            <Card style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.totalCompletions}</Text>
              <Text style={styles.indicatorLabel}>Registros</Text>
            </Card>
            <Card style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.activeHabitCount}</Text>
              <Text style={styles.indicatorLabel}>Hábitos activos</Text>
            </Card>
          </View>

          {progress.hasEnoughData ? (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Avance {progress.period === 'weekly' ? 'semanal' : 'mensual'}</Text>
              {progress.points.map((point) => (
                <View key={point.date} style={styles.chartRow}>
                  <Text style={styles.chartDate}>{point.date.slice(5)}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          width: `${point.completionRate}%`,
                          backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{point.completionCount}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              description="Aún no existen datos suficientes para generar una visualización significativa."
              icon="bar-chart"
              title="Progreso pendiente"
            />
          )}
        </>
      ) : null}
      </ScreenContainer>
    </LinearGradient>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  periodSelector: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flexDirection: 'row',
    padding: 6,
  },
  periodButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.72,
  },
  periodButtonText: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  periodButtonTextActive: {
    color: colors.textPrimary,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  loadingText: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  indicatorCard: {
    flexGrow: 1,
    minWidth: 96,
  },
  indicatorValue: {
    fontFamily: typography.fontFamilyRound,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.6,
  },
  indicatorLabel: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: typography.weights.semibold,
  },
  chartCard: {
    gap: 10,
  },
  chartTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  chartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  chartDate: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    width: 44,
  },
  chartTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  chartBar: {
    borderRadius: radius.pill,
    height: '100%',
  },
  chartValue: {
    fontFamily: typography.fontFamilyRound,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    width: 26,
  },
});
