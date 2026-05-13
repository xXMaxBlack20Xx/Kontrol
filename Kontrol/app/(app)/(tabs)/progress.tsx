import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, radius, spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';
import { buildProgressSummary, type ProgressPeriod, type ProgressSummary } from '@/features/habits/completion';
import { fileCompletionRepository } from '@/features/habits/local-completion-repository';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';

export default function ProgressScreen() {
  const { user } = useAuth();
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
        const [habits, completions] = await Promise.all([
          fileHabitRepository.listByAccount(user.accountId),
          fileCompletionRepository.listByAccount(user.accountId),
        ]);

        if (isMounted) {
          setProgress(buildProgressSummary(habits, completions, period));
        }
      } catch {
        if (isMounted) {
          setProgress(null);
          setMessage('No se pudo cargar el progreso local. Intenta nuevamente.');
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

  return (
    <ScreenContainer contentStyle={styles.content} edges={['top']}>
      <AppHeader
        description="Consulta tus avances con indicadores simples calculados desde tus registros locales."
        eyebrow="Kontrol"
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
                    <View style={[styles.chartBar, { width: `${point.completionRate}%` }]} />
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
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  periodSelector: {
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    flexDirection: 'row',
    padding: 4,
  },
  periodButton: {
    alignItems: 'center',
    borderRadius: 14,
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
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
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
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  indicatorLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  chartCard: {
    gap: 10,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  chartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  chartDate: {
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
    backgroundColor: colors.textPrimary,
    borderRadius: radius.pill,
    height: '100%',
  },
  chartValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    width: 26,
  },
});
