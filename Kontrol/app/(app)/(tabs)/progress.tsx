import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Kontrol</Text>
        <Text style={styles.title}>Progreso</Text>
        <Text style={styles.description}>
          Consulta tus avances con indicadores simples calculados desde tus registros locales.
        </Text>
      </View>

      <View style={styles.periodSelector}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPeriod('weekly')}
          style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}>
          <Text style={[styles.periodButtonText, period === 'weekly' && styles.periodButtonTextActive]}>
            Semanal
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPeriod('monthly')}
          style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}>
          <Text style={[styles.periodButtonText, period === 'monthly' && styles.periodButtonTextActive]}>
            Mensual
          </Text>
        </Pressable>
      </View>

      {isLoading ? <ActivityIndicator color="#0A84FF" /> : null}

      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}

      {progress ? (
        <>
          <View style={styles.indicatorGrid}>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.completionRate}%</Text>
              <Text style={styles.indicatorLabel}>Cumplimiento</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.totalCompletions}</Text>
              <Text style={styles.indicatorLabel}>Registros</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{progress.activeHabitCount}</Text>
              <Text style={styles.indicatorLabel}>Habitos activos</Text>
            </View>
          </View>

          {progress.hasEnoughData ? (
            <View style={styles.chartCard}>
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
            </View>
          ) : (
            <Text style={styles.emptyMessage}>
              Aun no existen datos suficientes para generar una visualizacion significativa.
            </Text>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F7F8',
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 24,
  },
  header: {
    gap: 10,
    marginBottom: 8,
  },
  eyebrow: {
    color: '#6E6E73',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '700',
  },
  description: {
    color: '#5F6368',
    fontSize: 17,
    lineHeight: 24,
  },
  periodSelector: {
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 4,
  },
  periodButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 10,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodButtonText: {
    color: '#6E6E73',
    fontSize: 15,
    fontWeight: '700',
  },
  periodButtonTextActive: {
    color: '#0A84FF',
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  indicatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexGrow: 1,
    minWidth: 96,
    padding: 16,
  },
  indicatorValue: {
    color: '#1D1D1F',
    fontSize: 26,
    fontWeight: '800',
  },
  indicatorLabel: {
    color: '#6E6E73',
    fontSize: 14,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  chartTitle: {
    color: '#1D1D1F',
    fontSize: 18,
    fontWeight: '700',
  },
  chartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  chartDate: {
    color: '#6E6E73',
    fontSize: 13,
    width: 44,
  },
  chartTrack: {
    backgroundColor: '#F2F2F7',
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  chartBar: {
    backgroundColor: '#34C759',
    borderRadius: 999,
    height: '100%',
  },
  chartValue: {
    color: '#3A3A3C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    width: 26,
  },
  emptyMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    color: '#6E6E73',
    fontSize: 15,
    lineHeight: 21,
    padding: 14,
  },
});
