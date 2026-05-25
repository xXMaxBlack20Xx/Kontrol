import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, InteractionManager, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HabitCard } from '@/components/habit-card';
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
  CompleteHabitError,
  completeHabitErrorMessages,
  completeHabitForToday,
  summarizeCompletionsForToday,
  type HabitCompletionRecord,
  type HabitCompletionSummary,
} from '@/features/habits/completion';
import {
  deleteHabit,
  DeleteHabitError,
  deleteHabitErrorMessages,
  editHabit,
  type HabitRecord,
} from '@/features/habits/habit';
import { remoteCompletionRepository } from '@/features/habits/remote-completion-repository';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { habitDetailHref, habitEditHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import { deleteHabitReminder, type ReminderRecord } from '@/features/reminders/reminder';
import { deleteRemoteReminderByHabitId } from '@/features/reminders/remote-reminder-service';
import { Confetti } from '@/components/ui/confetti';
import {
  calculateTodaySummary,
  getActiveHabits,
  getNextScheduledDayLabel,
  isHabitScheduledForDate,
  isHabitScheduledToday,
} from '@/features/habits/progress-helpers';

export default function HabitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const showInfoAlert = () => {
    Alert.alert(
      'Acerca de tus Hábitos',
      'Registra tus avances diarios y mantén visible tu constancia localmente en este dispositivo.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [completions, setCompletions] = useState<HabitCompletionRecord[]>([]);
  const [completionByHabit, setCompletionByHabit] = useState<Record<string, HabitCompletionSummary>>({});
  const [reminderByHabit, setReminderByHabit] = useState<Record<string, ReminderRecord>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  const handleConfettiEnd = useCallback(() => {
    setIsConfettiActive(false);
  }, []);

  const loadHabits = useCallback(async (options: { showSpinner?: boolean } = {}) => {
    const showSpinner = options.showSpinner ?? true;

    if (!user) {
      setHabits([]);
      setCompletions([]);
      setCompletionByHabit({});
      setReminderByHabit({});
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (showSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setMessage(null);

    try {
      const [storedHabits, completions, reminders] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        remoteCompletionRepository.listByAccount(user.accountId),
        fileReminderRepository.listByAccount(user.accountId),
      ]);

      setHabits(storedHabits);
      setCompletions(completions);
      setCompletionByHabit(summarizeCompletionsForToday(completions));
      setReminderByHabit(Object.fromEntries(reminders.map((reminder) => [reminder.habitId, reminder])));
    } catch {
      setHabits([]);
      setCompletions([]);
      setCompletionByHabit({});
      setReminderByHabit({});
      setIsSuccess(false);
      setMessage('No se pudieron cargar tus hábitos desde Kontrol. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHabits({ showSpinner: true });
    }, [loadHabits]),
  );

  function handleRefresh() {
    loadHabits({ showSpinner: false });
  }

  async function handleCompleteHabit(habit: HabitRecord) {
    if (!isHabitScheduledToday(habit)) {
      setIsSuccess(false);
      setMessage(completeHabitErrorMessages.HABIT_NOT_SCHEDULED_TODAY);
      return;
    }

    if (completionByHabit[habit.id]?.completedToday) {
      setIsSuccess(true);
      setMessage('Este hábito ya estaba completado hoy.');
      return;
    }

    setCompletingHabitId(habit.id);
    setMessage(null);
    setIsSuccess(false);

    try {
      const result = await completeHabitForToday(habit, remoteCompletionRepository);

      setCompletions((currentCompletions) => {
        const exists = currentCompletions.some(
          (completion) =>
            completion.habitId === result.completion.habitId &&
            completion.completedOn === result.completion.completedOn,
        );

        return exists ? currentCompletions : [...currentCompletions, result.completion];
      });

      setCompletionByHabit((currentCompletionByHabit) => {
        const nextCompletionByHabit = {
          ...currentCompletionByHabit,
          [habit.id]: {
            completedToday: true,
            currentStreak: result.currentStreak,
          },
        };

        // Trigger confetti only when all scheduled habits for today are completed
        const todayDate = new Date();
        const scheduledTodayHabits = getActiveHabits(habits).filter((h) => isHabitScheduledForDate(h, todayDate));
        const total = scheduledTodayHabits.length;

        if (total > 0) {
          const completedCount = scheduledTodayHabits.filter(
            (h) => nextCompletionByHabit[h.id]?.completedToday
          ).length;

          const wasAlreadyCompleted = scheduledTodayHabits.filter(
            (h) => currentCompletionByHabit[h.id]?.completedToday
          ).length === total;

          if (completedCount === total && !wasAlreadyCompleted) {
            InteractionManager.runAfterInteractions(() => {
              setIsConfettiActive(true);
            });
          }
        }

        return nextCompletionByHabit;
      });

      setIsSuccess(true);
      setMessage(
        result.didCreate
          ? `Cumplimiento registrado. Racha actual: ${result.currentStreak} día(s).`
          : 'Este hábito ya estaba completado hoy.',
      );
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof CompleteHabitError) {
        setMessage(completeHabitErrorMessages[error.code]);
      } else {
        setMessage(completeHabitErrorMessages.HABIT_COMPLETION_UNAVAILABLE);
      }
    } finally {
      setCompletingHabitId(null);
    }
  }

  function confirmDeleteHabit(habit: HabitRecord) {
    Alert.alert('Eliminar hábito', 'Esta acción retirará el hábito de la aplicación.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: () => handleDeleteHabit(habit),
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  async function handleDeleteHabit(habit: HabitRecord) {
    setDeletingHabitId(habit.id);
    setMessage(null);
    setIsSuccess(false);

    try {
      const deletedHabit = await deleteHabit(habit, true, remoteHabitRepository);
      const reminder = reminderByHabit[deletedHabit.id];
      let reminderWarning: string | null = null;

      if (reminder) {
        try {
          await deleteHabitReminder(
            { habitId: deletedHabit.id, confirmed: true },
            fileReminderRepository,
            expoNotificationScheduler,
          );
          deleteRemoteReminderByHabitId(deletedHabit.id).catch(() => undefined);
        } catch {
          reminderWarning = 'El hábito fue eliminado, pero no se pudo cancelar su recordatorio local.';
        }
      }

      setHabits((currentHabits) => currentHabits.filter((currentHabit) => currentHabit.id !== deletedHabit.id));
      setCompletions((currentCompletions) =>
        currentCompletions.filter((completion) => completion.habitId !== deletedHabit.id),
      );
      setCompletionByHabit((currentCompletionByHabit) => {
        const updatedCompletionByHabit = { ...currentCompletionByHabit };
        delete updatedCompletionByHabit[deletedHabit.id];

        return updatedCompletionByHabit;
      });
      setReminderByHabit((currentReminders) => {
        const updatedReminders = { ...currentReminders };
        delete updatedReminders[deletedHabit.id];

        return updatedReminders;
      });
      setIsSuccess(!reminderWarning);
      setMessage(reminderWarning ?? 'Hábito eliminado.');
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof DeleteHabitError) {
        setMessage(deleteHabitErrorMessages[error.code]);
      } else {
        setMessage(deleteHabitErrorMessages.HABIT_DELETE_UNAVAILABLE);
      }
    } finally {
      setDeletingHabitId(null);
    }
  }

  async function clearReminderTime(habit: HabitRecord) {
    const updatedHabit = await editHabit(habit, { reminderTime: '' }, remoteHabitRepository);

    setHabits((currentHabits) =>
      currentHabits.map((currentHabit) => (currentHabit.id === updatedHabit.id ? updatedHabit : currentHabit)),
    );
  }

  async function handleDeleteReminder(habit: HabitRecord) {
    setMessage(null);
    setIsSuccess(false);

    try {
      await deleteHabitReminder(
        { habitId: habit.id, confirmed: true },
        fileReminderRepository,
        expoNotificationScheduler,
      );
      deleteRemoteReminderByHabitId(habit.id).catch(() => undefined);
      await clearReminderTime(habit);

      setReminderByHabit((currentReminders) => {
        const updatedReminders = { ...currentReminders };
        delete updatedReminders[habit.id];

        return updatedReminders;
      });
      setIsSuccess(true);
      setMessage('Recordatorio eliminado.');
    } catch {
      setIsSuccess(false);
      setMessage('No se pudo eliminar el recordatorio. Intenta nuevamente.');
    }
  }

  function confirmDeleteReminder(habit: HabitRecord) {
    Alert.alert('Eliminar recordatorio', 'Confirma para retirar la notificación local de este hábito.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: () => handleDeleteReminder(habit),
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;
  const visibleHabits = getActiveHabits(habits);
  const todaySummary = calculateTodaySummary(visibleHabits, completions);
  const isInitialLoading = isLoading && visibleHabits.length === 0;

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
        refreshControl={
          <RefreshControl
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={colors.textPrimary}
          />
        }
      >
      <View style={styles.heroBlock}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppHeader title="Hábitos" />
          </View>
          <Pressable
            onPress={showInfoAlert}
            style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
            hitSlop={12}
          >
            <MaterialIcons name="info-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <TodayProgressCard
        activeHabitCount={todaySummary.activeHabitCount}
        completedTodayCount={todaySummary.completedTodayCount}
        completionRate={todaySummary.completionRate}
        pendingTodayCount={todaySummary.pendingTodayCount}
        totalCompletions={todaySummary.totalCompletions}
        todayHabitCount={todaySummary.todayHabitCount}
      />

      {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

      {isInitialLoading ? (
        <HabitListSkeleton />
      ) : null}

      {!isLoading && visibleHabits.length === 0 ? (
        <EmptyState
          action={
            <SecondaryButton
              compact
              fullWidth={false}
              icon="add-circle-outline"
              onPress={() => router.push('/(app)/habits/create' as Href)}
              title="Crear primero"
            />
          }
          description="Crea tu primer hábito para iniciar tu registro diario."
          icon="playlist-add"
          title="Aún no tienes hábitos"
        />
      ) : null}

      {visibleHabits.length > 0 ? (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hoy</Text>
          <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
            {todaySummary.completedTodayCount}/{todaySummary.todayHabitCount} programados completados
          </Text>
        </View>
      ) : null}

      {visibleHabits.map((habit) => {
        const completionSummary = completionByHabit[habit.id] ?? {
          completedToday: false,
          currentStreak: 0,
        };
        const isCompletedToday = completionSummary.completedToday;
        const isScheduledToday = isHabitScheduledToday(habit);
        const nextScheduledDayLabel = isScheduledToday ? null : getNextScheduledDayLabel(habit);
        const scheduleDescription = isScheduledToday
          ? undefined
          : nextScheduledDayLabel
            ? `No toca hoy. Próximo: ${nextScheduledDayLabel}.`
            : 'No toca hoy.';
        const reminderTime = reminderByHabit[habit.id]?.time;
        const isCompleting = completingHabitId === habit.id;

        return (
          <HabitCard
            key={habit.id}
            category={habit.category}
            color={habit.color}
            completedToday={isCompletedToday}
            coverPhotoUrl={habit.coverPhotoUrl}
            daysOfWeek={habit.daysOfWeek}
            icon={habit.icon}
            name={habit.name}
            reminderTime={reminderTime}
            scheduleDescription={scheduleDescription}
            streak={completionSummary.currentStreak}
            statusLabel={isCompletedToday ? 'Completado' : isScheduledToday ? 'Pendiente' : 'No toca hoy'}
            statusTone={isCompletedToday ? 'success' : isScheduledToday ? 'default' : 'muted'}
            subcategories={habit.subcategories}
            target={habit.target}
            actions={
              <>
                {isCompletedToday ? (
                  <SecondaryButton compact disabled fullWidth={false} icon="done" title="Completado" />
                ) : !isScheduledToday ? (
                  <SecondaryButton compact disabled fullWidth={false} icon="event-busy" title="No toca hoy" />
                ) : (
                  <PrimaryButton
                    compact
                    fullWidth={false}
                    icon="check"
                    loading={isCompleting}
                    onPress={() => handleCompleteHabit(habit)}
                    title="Completar"
                  />
                )}
                <SecondaryButton
                  compact
                  fullWidth={false}
                  icon="chevron-right"
                  onPress={() => router.push(habitDetailHref(habit.id))}
                  title="Detalle"
                />
                <SecondaryButton
                  compact
                  fullWidth={false}
                  icon="edit"
                  onPress={() => router.push(habitEditHref(habit.id))}
                  title="Editar"
                />
                {reminderTime ? (
                  <SecondaryButton
                    compact
                    fullWidth={false}
                    icon="notifications-off"
                    onPress={() => confirmDeleteReminder(habit)}
                    title="Quitar recordatorio"
                    tone="danger"
                  />
                ) : null}
                <SecondaryButton
                  compact
                  disabled={deletingHabitId === habit.id}
                  fullWidth={false}
                  icon="delete-outline"
                  loading={deletingHabitId === habit.id}
                  onPress={() => confirmDeleteHabit(habit)}
                  title="Eliminar"
                  tone="danger"
                />
              </>
            }
          />
        );
      })}
      </ScreenContainer>

      <Confetti
        active={isConfettiActive}
        onAnimationEnd={handleConfettiEnd}
      />
    </LinearGradient>
  );
}

type TodayProgressCardProps = {
  activeHabitCount: number;
  completedTodayCount: number;
  completionRate: number;
  pendingTodayCount: number;
  totalCompletions: number;
  todayHabitCount: number;
};

function TodayProgressCard({
  activeHabitCount,
  completedTodayCount,
  completionRate,
  pendingTodayCount,
  totalCompletions,
  todayHabitCount,
}: TodayProgressCardProps) {
  const { colors } = useTheme();
  const safeCompletionRate = Math.max(0, Math.min(100, completionRate));
  const progressWidth = `${safeCompletionRate}%` as `${number}%`;

  return (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Resumen de hoy</Text>
          <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>{safeCompletionRate}% completado</Text>
        </View>
        <View style={[styles.progressBadge, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.progressBadgeText, { color: colors.textPrimary }]}>
            {completedTodayCount}/{todayHabitCount}
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: progressWidth }]} />
      </View>

      <View style={styles.progressStats}>
        <ProgressStat label="Activos" value={activeHabitCount} />
        <ProgressStat label="Hoy" value={todayHabitCount} />
        <ProgressStat label="Pendientes" value={pendingTodayCount} />
        <ProgressStat label="Registros" value={totalCompletions} />
      </View>
    </Card>
  );
}

function ProgressStat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.progressStat}>
      <Text style={[styles.progressStatValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function HabitListSkeleton() {
  const { colors } = useTheme();

  return (
    <Card style={styles.skeletonCard}>
      <View style={styles.loadingRow}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando hábitos...</Text>
      </View>
      <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceMuted, width: '72%' }]} />
      <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceMuted, width: '48%' }]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  heroBlock: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  progressCard: {
    gap: spacing.md,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
  },
  progressTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 25,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.7,
    marginLeft: -2,
  },
  progressBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressBadgeText: {
    fontFamily: typography.fontFamilyRound,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
  },
  progressTrack: {
    borderRadius: radius.pill,
    height: 9,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  progressStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressStat: {
    flex: 1,
    gap: 2,
  },
  progressStatValue: {
    fontFamily: typography.fontFamilyRound,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
  },
  progressStatLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
  },
  skeletonCard: {
    gap: spacing.md,
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
    fontSize: 15,
    fontWeight: '600',
  },
  skeletonLine: {
    borderRadius: radius.pill,
    height: 14,
  },
});
