import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { HabitCard } from '@/components/habit-card';
import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import {
  CompleteHabitError,
  completeHabitErrorMessages,
  completeHabitForToday,
  summarizeCompletionsForToday,
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

export default function HabitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [completionByHabit, setCompletionByHabit] = useState<Record<string, HabitCompletionSummary>>({});
  const [reminderByHabit, setReminderByHabit] = useState<Record<string, ReminderRecord>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setCompletionByHabit({});
      setReminderByHabit({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const [storedHabits, completions, reminders] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        remoteCompletionRepository.listByAccount(user.accountId),
        fileReminderRepository.listByAccount(user.accountId),
      ]);

      setHabits(storedHabits);
      setCompletionByHabit(summarizeCompletionsForToday(completions));
      setReminderByHabit(Object.fromEntries(reminders.map((reminder) => [reminder.habitId, reminder])));
    } catch {
      setHabits([]);
      setCompletionByHabit({});
      setReminderByHabit({});
      setIsSuccess(false);
      setMessage('No se pudieron cargar tus hábitos desde Kontrol. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits]),
  );

  async function handleCompleteHabit(habit: HabitRecord) {
    setCompletingHabitId(habit.id);
    setMessage(null);
    setIsSuccess(false);

    try {
      const result = await completeHabitForToday(habit, remoteCompletionRepository);

      setCompletionByHabit((currentCompletionByHabit) => ({
        ...currentCompletionByHabit,
        [habit.id]: {
          completedToday: true,
          currentStreak: result.currentStreak,
        },
      }));
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
        description={`Sesión activa para ${user.email}. Registra avances diarios sincronizados con Kontrol.`}
        title="Hábitos"
      />

      <PrimaryButton
        fullWidth={false}
        icon="add"
        onPress={() => router.push('/(app)/habits/create' as Href)}
        title="Crear hábito"
      />

      {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando hábitos...</Text>
        </View>
      ) : null}

      {!isLoading && habits.length === 0 ? (
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

      {habits.map((habit) => {
        const completionSummary = completionByHabit[habit.id] ?? {
          completedToday: false,
          currentStreak: 0,
        };
        const isCompletedToday = completionSummary.completedToday;
        const reminderTime = reminderByHabit[habit.id]?.time;
        const isCompleting = completingHabitId === habit.id;

        return (
          <HabitCard
            key={habit.id}
            category={habit.category}
            completedToday={isCompletedToday}
            name={habit.name}
            reminderTime={reminderTime}
            streak={completionSummary.currentStreak}
            target={habit.target}
            actions={
              <>
                {isCompletedToday ? (
                  <SecondaryButton compact disabled fullWidth={false} icon="done" title="Completado" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
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
});
