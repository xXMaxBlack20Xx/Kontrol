import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
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
import { fileCompletionRepository } from '@/features/habits/local-completion-repository';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';
import { habitDetailHref, habitEditHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import { deleteHabitReminder, type ReminderRecord } from '@/features/reminders/reminder';

export default function HabitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
        fileHabitRepository.listByAccount(user.accountId),
        fileCompletionRepository.listByAccount(user.accountId),
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
      setMessage('No se pudieron cargar tus habitos locales. Intenta nuevamente.');
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
      const result = await completeHabitForToday(habit, fileCompletionRepository);

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
          ? `Cumplimiento registrado. Racha actual: ${result.currentStreak} dia(s).`
          : 'Este habito ya estaba completado hoy.',
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
    Alert.alert('Eliminar habito', 'Esta accion retirara el habito de la aplicacion.', [
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
      const deletedHabit = await deleteHabit(habit, true, fileHabitRepository);
      const reminder = reminderByHabit[deletedHabit.id];
      let reminderWarning: string | null = null;

      if (reminder) {
        try {
          await deleteHabitReminder(
            { habitId: deletedHabit.id, confirmed: true },
            fileReminderRepository,
            expoNotificationScheduler,
          );
        } catch {
          reminderWarning = 'El habito fue eliminado, pero no se pudo cancelar su recordatorio local.';
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
      setMessage(reminderWarning ?? 'Habito eliminado.');
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
    const updatedHabit = await editHabit(habit, { reminderTime: '' }, fileHabitRepository);

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
    Alert.alert('Eliminar recordatorio', 'Confirma para retirar la notificacion local de este habito.', [
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Kontrol</Text>
        <Text style={styles.title}>Habitos</Text>
        <Text style={styles.description}>
          Sesion activa para {user.email}. Registra avances diarios desde tu almacenamiento local.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(app)/habits/create' as Href)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
        <MaterialIcons color="#FFFFFF" name="add" size={20} />
        <Text style={styles.primaryButtonText}>Crear habito</Text>
      </Pressable>

      {message ? (
        <Text style={[styles.feedback, isSuccess ? styles.success : styles.error]}>{message}</Text>
      ) : null}

      {isLoading ? <ActivityIndicator color="#0A84FF" /> : null}

      {!isLoading && habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aun no tienes habitos</Text>
          <Text style={styles.emptyText}>Crea tu primer habito para iniciar tu registro diario.</Text>
          <Pressable
            onPress={() => router.push('/(app)/habits/create' as Href)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <MaterialIcons color="#0A84FF" name="add-circle-outline" size={20} />
            <Text style={styles.secondaryButtonText}>Crear primero</Text>
          </Pressable>
        </View>
      ) : null}

      {habits.map((habit) => {
        const completionSummary = completionByHabit[habit.id] ?? {
          completedToday: false,
          currentStreak: 0,
        };
        const isCompletedToday = completionSummary.completedToday;
        const reminderTime = reminderByHabit[habit.id]?.time;

        return (
          <View key={habit.id} style={[styles.habitCard, isCompletedToday && styles.habitCardCompleted]}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.habitDetail}>Frecuencia: diaria</Text>
            <Text style={styles.habitDetail}>Racha actual: {completionSummary.currentStreak} dia(s)</Text>
            <Text style={[styles.completionStatus, isCompletedToday && styles.completionStatusDone]}>
              {isCompletedToday ? 'Completado hoy' : 'Pendiente hoy'}
            </Text>
            {habit.category ? <Text style={styles.habitDetail}>Categoria: {habit.category}</Text> : null}
            {habit.target ? <Text style={styles.habitDetail}>Meta: {habit.target}</Text> : null}
            {reminderTime ? <Text style={styles.habitDetail}>Recordatorio: {reminderTime}</Text> : null}

            <View style={styles.cardActions}>
              <Pressable
                disabled={isCompletedToday || completingHabitId === habit.id}
                onPress={() => handleCompleteHabit(habit)}
                style={({ pressed }) => [
                  styles.completeButton,
                  isCompletedToday && styles.completeButtonDone,
                  (pressed || completingHabitId === habit.id) && styles.buttonPressed,
                ]}>
                <MaterialIcons color="#FFFFFF" name={isCompletedToday ? 'done' : 'check'} size={18} />
                <Text style={styles.completeButtonText}>{isCompletedToday ? 'Completado' : 'Completar'}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(habitDetailHref(habit.id))}
                style={styles.linkButton}>
                <Text style={styles.detailLinkText}>Detalle</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(habitEditHref(habit.id))}
                style={styles.linkButton}>
                <Text style={styles.editLinkText}>Editar</Text>
              </Pressable>
              {reminderTime ? (
                <Pressable onPress={() => confirmDeleteReminder(habit)} style={styles.linkButton}>
                  <Text style={styles.deleteLinkText}>Quitar recordatorio</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={deletingHabitId === habit.id}
                onPress={() => confirmDeleteHabit(habit)}
                style={styles.linkButton}>
                <Text style={styles.deleteLinkText}>
                  {deletingHabitId === habit.id ? 'Eliminando...' : 'Eliminar'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F7F8',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 10,
    marginBottom: 6,
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
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#0A84FF',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  feedback: {
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 20,
    padding: 12,
  },
  success: {
    backgroundColor: '#E8F7EE',
    color: '#137333',
  },
  error: {
    backgroundColor: '#FDECEC',
    color: '#B3261E',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  emptyTitle: {
    color: '#1D1D1F',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6E6E73',
    fontSize: 15,
    lineHeight: 21,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 6,
    padding: 16,
  },
  habitCardCompleted: {
    borderColor: '#34C759',
    borderWidth: 1,
  },
  habitName: {
    color: '#1D1D1F',
    fontSize: 18,
    fontWeight: '700',
  },
  habitDetail: {
    color: '#6E6E73',
    fontSize: 14,
    lineHeight: 20,
  },
  completionStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderRadius: 999,
    color: '#3A3A3C',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completionStatusDone: {
    backgroundColor: '#E8F7EE',
    color: '#137333',
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  completeButtonDone: {
    backgroundColor: '#34C759',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  linkButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  detailLinkText: {
    color: '#5856D6',
    fontSize: 15,
    fontWeight: '700',
  },
  editLinkText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteLinkText: {
    color: '#B3261E',
    fontSize: 15,
    fontWeight: '700',
  },
});
