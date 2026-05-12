import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
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
        setMessage('No se encontro este habito local.');
      }
    } catch {
      setHabit(null);
      setReminder(null);
      setMessage('No se pudo cargar el habito. Intenta nuevamente.');
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

    Alert.alert('Eliminar habito', 'Esta accion retirara el habito de la aplicacion.', [
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
          setMessage('El habito fue eliminado, pero no se pudo cancelar su recordatorio local.');
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons color="#0A84FF" name="arrow-back-ios-new" size={18} />
            <Text style={styles.backButtonText}>Detalle</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Editar habito</Text>
          <Text style={styles.title}>{habit?.name ?? 'Habito'}</Text>
        </View>

        {isLoading ? <ActivityIndicator color="#0A84FF" /> : null}

        {message ? (
          <Text style={[styles.feedback, isSuccess ? styles.success : styles.error]}>{message}</Text>
        ) : null}

        {habit ? (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                onChangeText={setEditHabitName}
                placeholder="Leer 30 minutos"
                placeholderTextColor="#8A8A8E"
                style={styles.input}
                value={editHabitName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Frecuencia</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditHabitFrequency('daily')}
                style={[styles.frequencyOption, editHabitFrequency === 'daily' && styles.frequencySelected]}>
                <Text
                  style={[
                    styles.frequencyText,
                    editHabitFrequency === 'daily' && styles.frequencySelectedText,
                  ]}>
                  Diaria
                </Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Categoria</Text>
              <TextInput
                onChangeText={setEditHabitCategory}
                placeholder="personal"
                placeholderTextColor="#8A8A8E"
                style={styles.input}
                value={editHabitCategory}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Meta</Text>
              <TextInput
                onChangeText={setEditHabitTarget}
                placeholder="leer 10 paginas"
                placeholderTextColor="#8A8A8E"
                style={styles.input}
                value={editHabitTarget}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Recordatorio</Text>
              <TextInput
                inputMode="numeric"
                onChangeText={setEditHabitReminderTime}
                placeholder="08:00"
                placeholderTextColor="#8A8A8E"
                style={styles.input}
                value={editHabitReminderTime}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                disabled={isSubmitting}
                onPress={handleSaveHabitEdit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting) && styles.buttonPressed,
                ]}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons color="#FFFFFF" name="save" size={20} />
                    <Text style={styles.primaryButtonText}>Guardar</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                disabled={isDeleting}
                onPress={confirmDeleteHabit}
                style={({ pressed }) => [
                  styles.dangerButton,
                  (pressed || isDeleting) && styles.buttonPressed,
                ]}>
                <MaterialIcons color="#FFFFFF" name="delete-outline" size={20} />
                <Text style={styles.primaryButtonText}>{isDeleting ? 'Eliminando' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    minHeight: 36,
  },
  backButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '700',
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
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 18,
    padding: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#1D1D1F',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
    borderRadius: 16,
    borderWidth: 1,
    color: '#111111',
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  frequencyOption: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#0A84FF',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  frequencySelected: {
    backgroundColor: '#0A84FF',
  },
  frequencyText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '700',
  },
  frequencySelectedText: {
    color: '#FFFFFF',
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#B3261E',
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
  buttonPressed: {
    opacity: 0.72,
  },
});
