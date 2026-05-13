import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { DestructiveButton, PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage, SelectPill, TextInputField } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, spacing } from '@/components/ui/theme';
import { useAuth } from '@/features/account/auth-context';
import {
  deleteHabit,
  DeleteHabitError,
  deleteHabitErrorMessages,
  editHabit,
  EditHabitError,
  editHabitErrorMessages,
  type HabitRecord,
} from '@/features/habits/habit';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';
import { habitDetailHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  deleteHabitReminder,
  ReminderError,
  reminderErrorMessages,
  saveHabitReminder,
  validateReminderTime,
  type ReminderRecord,
} from '@/features/reminders/reminder';

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const habitId = Array.isArray(id) ? id[0] : id;
  const [habit, setHabit] = useState<HabitRecord | null>(null);
  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitFrequency, setEditHabitFrequency] = useState('daily');
  const [editHabitCategory, setEditHabitCategory] = useState('');
  const [editHabitTarget, setEditHabitTarget] = useState('');
  const [editHabitReminderTime, setEditHabitReminderTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHabit = useCallback(async () => {
    if (!user || !habitId) {
      setHabit(null);
      setReminder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const [storedHabits, storedReminder] = await Promise.all([
        fileHabitRepository.listByAccount(user.accountId),
        fileReminderRepository.findByHabitId(habitId),
      ]);
      const selectedHabit = storedHabits.find((currentHabit) => currentHabit.id === habitId) ?? null;

      setHabit(selectedHabit);
      setReminder(storedReminder);

      if (selectedHabit) {
        setEditHabitName(selectedHabit.name);
        setEditHabitFrequency(selectedHabit.frequency);
        setEditHabitCategory(selectedHabit.category ?? '');
        setEditHabitTarget(selectedHabit.target ?? '');
        setEditHabitReminderTime(storedReminder?.time ?? '');
      } else {
        setMessage('No se encontró este hábito local.');
      }
    } catch {
      setHabit(null);
      setReminder(null);
      setMessage('No se pudo cargar el hábito. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [habitId, user]);

  useFocusEffect(
    useCallback(() => {
      loadHabit();
    }, [loadHabit]),
  );

  function getReminderMessage(error: unknown): string {
    if (error instanceof ReminderError) {
      return reminderErrorMessages[error.code];
    }

    return reminderErrorMessages.REMINDER_SAVE_UNAVAILABLE;
  }

  async function syncReminder(updatedHabit: HabitRecord): Promise<HabitRecord> {
    if (editHabitReminderTime.trim()) {
      const reminderValidationError = validateReminderTime(editHabitReminderTime);

      if (reminderValidationError) {
        throw new ReminderError(reminderValidationError);
      }

      const updatedReminder = await saveHabitReminder(
        {
          accountId: updatedHabit.accountId,
          habitId: updatedHabit.id,
          habitName: updatedHabit.name,
          time: editHabitReminderTime,
        },
        fileReminderRepository,
        expoNotificationScheduler,
      );
      setReminder(updatedReminder);

      return editHabit(updatedHabit, { reminderTime: updatedReminder.time }, fileHabitRepository);
    }

    if (reminder) {
      await deleteHabitReminder(
        { habitId: updatedHabit.id, confirmed: true },
        fileReminderRepository,
        expoNotificationScheduler,
      );
      setReminder(null);

      return editHabit(updatedHabit, { reminderTime: '' }, fileHabitRepository);
    }

    return editHabit(updatedHabit, { reminderTime: '' }, fileHabitRepository);
  }

  async function handleSaveHabitEdit() {
    if (!habit) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      const editedHabit = await editHabit(
        habit,
        {
          category: editHabitCategory,
          frequency: editHabitFrequency,
          name: editHabitName,
          reminderTime: habit.reminderTime,
          target: editHabitTarget,
        },
        fileHabitRepository,
      );
      const syncedHabit = await syncReminder(editedHabit);

      setHabit(syncedHabit);
      setIsSuccess(true);
      setMessage('Cambios guardados.');
      router.replace(habitDetailHref(syncedHabit.id));
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof EditHabitError) {
        setMessage(editHabitErrorMessages[error.code]);
      } else if (error instanceof ReminderError) {
        setMessage(getReminderMessage(error));
      } else {
        setMessage(editHabitErrorMessages.HABIT_EDIT_UNAVAILABLE);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDeleteHabit() {
    if (!habit) {
      return;
    }

    Alert.alert('Eliminar hábito', 'Esta acción retirará el hábito de la aplicación.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleDeleteHabit,
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  async function handleDeleteHabit() {
    if (!habit) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      const deletedHabit = await deleteHabit(habit, true, fileHabitRepository);

      if (reminder) {
        try {
          await deleteHabitReminder(
            { habitId: deletedHabit.id, confirmed: true },
            fileReminderRepository,
            expoNotificationScheduler,
          );
        } catch {
          setMessage('El hábito fue eliminado, pero no se pudo cancelar su recordatorio local.');
        }
      }

      router.replace('/(app)/(tabs)/habits' as Href);
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof DeleteHabitError) {
        setMessage(deleteHabitErrorMessages[error.code]);
      } else {
        setMessage(deleteHabitErrorMessages.HABIT_DELETE_UNAVAILABLE);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  return (
    <ScreenContainer contentStyle={styles.content} edges={['top']} keyboardAvoiding>
      <AppHeader
        backLabel="Detalle"
        eyebrow="Editar hábito"
        onBack={() => router.back()}
        title={habit?.name ?? 'Hábito'}
      />

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.loadingText}>Cargando hábito...</Text>
        </View>
      ) : null}

      {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

      {habit ? (
        <Card style={styles.form}>
          <TextInputField
            label="Nombre"
            onChangeText={setEditHabitName}
            placeholder="Leer 30 minutos"
            value={editHabitName}
          />

          <SelectPill
            label="Diaria"
            onPress={() => setEditHabitFrequency('daily')}
            selected={editHabitFrequency === 'daily'}
          />

          <TextInputField
            label="Categoría"
            onChangeText={setEditHabitCategory}
            placeholder="personal"
            value={editHabitCategory}
          />

          <TextInputField
            label="Meta"
            onChangeText={setEditHabitTarget}
            placeholder="leer 10 páginas"
            value={editHabitTarget}
          />

          <TextInputField
            inputMode="numeric"
            label="Recordatorio"
            onChangeText={setEditHabitReminderTime}
            placeholder="08:00"
            value={editHabitReminderTime}
          />

          <View style={styles.actions}>
            <PrimaryButton
              fullWidth={false}
              icon="save"
              loading={isSubmitting}
              onPress={handleSaveHabitEdit}
              title="Guardar"
            />

            <DestructiveButton
              fullWidth={false}
              icon="delete-outline"
              loading={isDeleting}
              onPress={confirmDeleteHabit}
              title="Eliminar"
            />
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
