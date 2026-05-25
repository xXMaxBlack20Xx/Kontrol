import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import {
  buildHabitDetailSummary,
  CompleteHabitError,
  completeHabitErrorMessages,
  completeHabitForToday,
  type HabitDetailSummary,
} from '@/features/habits/completion';
import { formatHabitDays, type HabitRecord } from '@/features/habits/habit';
import { remoteCompletionRepository } from '@/features/habits/remote-completion-repository';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { habitEditHref } from '@/features/navigation/routes';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import type { ReminderRecord } from '@/features/reminders/reminder';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const habitId = Array.isArray(id) ? id[0] : id;
  const [habitDetail, setHabitDetail] = useState<HabitDetailSummary | null>(null);
  const [habit, setHabit] = useState<HabitRecord | null>(null);
  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadHabitDetail = useCallback(async () => {
    if (!user || !habitId) {
      setHabit(null);
      setHabitDetail(null);
      setReminder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const [storedHabits, completions, storedReminder] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        remoteCompletionRepository.listByHabit(habitId),
        fileReminderRepository.findByHabitId(habitId),
      ]);
      const selectedHabit = storedHabits.find((currentHabit) => currentHabit.id === habitId) ?? null;
      const detail = buildHabitDetailSummary(selectedHabit, completions);

      setHabit(selectedHabit);
      setHabitDetail(detail);
      setReminder(storedReminder);

      if (!detail) {
        setMessage('El hábito ya no está disponible. Regresa a la lista principal.');
      }
    } catch {
      setHabit(null);
      setHabitDetail(null);
      setReminder(null);
      setMessage('No se pudo abrir el detalle del hábito. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [habitId, user]);

  useFocusEffect(
    useCallback(() => {
      loadHabitDetail();
    }, [loadHabitDetail]),
  );

  async function handleCompleteHabit() {
    if (!habit) {
      return;
    }

    setIsCompleting(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      await completeHabitForToday(habit, remoteCompletionRepository);
      const completions = await remoteCompletionRepository.listByHabit(habit.id);

      setHabitDetail(buildHabitDetailSummary(habit, completions));
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof CompleteHabitError) {
        setMessage(completeHabitErrorMessages[error.code]);
      } else {
        setMessage(completeHabitErrorMessages.HABIT_COMPLETION_UNAVAILABLE);
      }
    } finally {
      setIsCompleting(false);
    }
  }

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
        backLabel="Hábitos"
        eyebrow="Detalle del hábito"
        onBack={() => router.back()}
        title={habitDetail?.habit.name ?? 'Hábito'}
      />

      {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      ) : null}

      {habitDetail ? (
        <Card style={styles.card}>
          {habitDetail.habit.coverPhotoUrl ? (
            <Image source={{ uri: habitDetail.habit.coverPhotoUrl }} style={styles.coverImage} />
          ) : null}

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado de hoy</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {habitDetail.completedToday ? 'Completado' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <View style={styles.detailList}>
            <Text style={styles.habitDetail}>Frecuencia: {formatHabitDays(habitDetail.habit.daysOfWeek)}</Text>
            {habitDetail.habit.category ? (
              <Text style={styles.habitDetail}>Categoría: {habitDetail.habit.category}</Text>
            ) : null}
            {habitDetail.habit.subcategories?.length ? (
              <Text style={styles.habitDetail}>Subcategorías: {habitDetail.habit.subcategories.join(', ')}</Text>
            ) : null}
            {habitDetail.habit.target ? (
              <Text style={styles.habitDetail}>Meta: {habitDetail.habit.target}</Text>
            ) : null}
            {reminder?.time ? (
              <Text style={styles.habitDetail}>
                Recordatorio: <Text style={styles.roundedNumber}>{reminder.time}</Text>
              </Text>
            ) : null}
            <Text style={styles.habitDetail}>
              Racha actual: <Text style={styles.roundedNumber}>{habitDetail.currentStreak}</Text> día(s)
            </Text>
          </View>

          <View style={styles.actions}>
            {habitDetail.completedToday ? (
              <SecondaryButton compact disabled fullWidth={false} icon="done" title="Completado" />
            ) : (
              <PrimaryButton
                compact
                fullWidth={false}
                icon="check"
                loading={isCompleting}
                onPress={handleCompleteHabit}
                title="Completar hoy"
              />
            )}
            <SecondaryButton
              compact
              fullWidth={false}
              icon="edit"
              onPress={() => router.push(habitEditHref(habitDetail.habit.id))}
              title="Editar"
            />
          </View>

          <View style={styles.historyBlock}>
            <Text style={styles.historyTitle}>Historial básico</Text>
            {habitDetail.hasEnoughHistory ? (
              habitDetail.historyDates.map((completedOn) => (
                <Text key={completedOn} style={styles.historyItem}>
                  Cumplido el {completedOn}
                </Text>
              ))
            ) : (
              <Text style={styles.historyEmpty}>Todavía no hay historial suficiente para este hábito.</Text>
            )}
          </View>
        </Card>
      ) : null}

      {!isLoading && !habitDetail ? (
        <EmptyState
          description="No se encontraron datos válidos para este hábito. Vuelve a la lista para continuar."
          icon="error-outline"
          title="Hábito no disponible"
        />
      ) : null}
      </ScreenContainer>
    </LinearGradient>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
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
  card: {
    gap: spacing.lg,
  },
  coverImage: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    height: 180,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  statusText: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.weights.heavy,
  },
  detailList: {
    gap: 5,
  },
  habitDetail: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: spacing.md,
  },
  historyTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  historyItem: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  historyEmpty: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  roundedNumber: {
    fontFamily: typography.fontFamilyRound,
    fontWeight: typography.weights.semibold,
  },
});
