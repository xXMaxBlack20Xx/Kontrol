import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
  createHabit,
  CreateHabitError,
  createHabitErrorMessages,
  editHabit,
} from '@/features/habits/habit';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  ReminderError,
  reminderErrorMessages,
  saveHabitReminder,
  validateReminderTime,
} from '@/features/reminders/reminder';

export default function CreateHabitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [habitName, setHabitName] = useState('');
  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [habitCategory, setHabitCategory] = useState('');
  const [habitTarget, setHabitTarget] = useState('');
  const [habitReminderTime, setHabitReminderTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getReminderMessage(error: unknown): string {
    if (error instanceof ReminderError) {
      return reminderErrorMessages[error.code];
    }

    return reminderErrorMessages.REMINDER_SAVE_UNAVAILABLE;
  }

  async function handleCreateHabit() {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    if (habitReminderTime.trim()) {
      const reminderValidationError = validateReminderTime(habitReminderTime);

      if (reminderValidationError) {
        setMessage(reminderErrorMessages[reminderValidationError]);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let habit = await createHabit(
        {
          accountId: user.accountId,
          category: habitCategory,
          frequency: habitFrequency,
          name: habitName,
          reminderTime: '',
          target: habitTarget,
        },
        fileHabitRepository,
      );

      if (habitReminderTime.trim()) {
        try {
          const reminder = await saveHabitReminder(
            {
              accountId: user.accountId,
              habitId: habit.id,
              habitName: habit.name,
              time: habitReminderTime,
            },
            fileReminderRepository,
            expoNotificationScheduler,
          );

          habit = await editHabit(habit, { reminderTime: reminder.time }, fileHabitRepository);
        } catch (error) {
          setIsSuccess(false);
          setMessage(`Habito creado sin recordatorio. ${getReminderMessage(error)}`);
          return;
        }
      }

      setIsSuccess(true);
      setMessage('Habito creado.');
      router.replace('/(app)/(tabs)/habits' as Href);
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof CreateHabitError) {
        setMessage(createHabitErrorMessages[error.code]);
      } else {
        setMessage(createHabitErrorMessages.HABIT_CREATION_UNAVAILABLE);
      }
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.backButtonText}>Habitos</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Nuevo habito</Text>
          <Text style={styles.title}>Crear habito</Text>
          <Text style={styles.description}>Define una accion diaria sencilla para empezar a medirla.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              onChangeText={setHabitName}
              placeholder="Leer"
              placeholderTextColor="#8A8A8E"
              style={styles.input}
              value={habitName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Frecuencia</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setHabitFrequency('daily')}
              style={[styles.frequencyOption, habitFrequency === 'daily' && styles.frequencySelected]}>
              <Text
                style={[
                  styles.frequencyText,
                  habitFrequency === 'daily' && styles.frequencySelectedText,
                ]}>
                Diaria
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Categoria opcional</Text>
            <TextInput
              onChangeText={setHabitCategory}
              placeholder="estudio"
              placeholderTextColor="#8A8A8E"
              style={styles.input}
              value={habitCategory}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Meta opcional</Text>
            <TextInput
              onChangeText={setHabitTarget}
              placeholder="leer 10 paginas"
              placeholderTextColor="#8A8A8E"
              style={styles.input}
              value={habitTarget}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Recordatorio inicial opcional</Text>
            <TextInput
              inputMode="numeric"
              onChangeText={setHabitReminderTime}
              placeholder="08:00"
              placeholderTextColor="#8A8A8E"
              style={styles.input}
              value={habitReminderTime}
            />
          </View>

          {message ? (
            <Text style={[styles.feedback, isSuccess ? styles.success : styles.error]}>{message}</Text>
          ) : null}

          <Pressable
            disabled={isSubmitting}
            onPress={handleCreateHabit}
            style={({ pressed }) => [
              styles.button,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons color="#FFFFFF" name="save" size={20} />
                <Text style={styles.buttonText}>Guardar habito</Text>
              </>
            )}
          </Pressable>
        </View>
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
    gap: 18,
    padding: 24,
  },
  header: {
    gap: 10,
    marginBottom: 8,
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
  description: {
    color: '#5F6368',
    fontSize: 17,
    lineHeight: 24,
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
  button: {
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
