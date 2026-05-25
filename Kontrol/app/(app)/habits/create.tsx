import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage, SelectPill, TextInputField } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, spacing } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import {
  createHabit,
  CreateHabitError,
  createHabitErrorMessages,
  editHabit,
} from '@/features/habits/habit';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  ReminderError,
  reminderErrorMessages,
  saveHabitReminder,
  validateReminderTime,
} from '@/features/reminders/reminder';
import { syncRemoteReminder } from '@/features/reminders/remote-reminder-service';

export default function CreateHabitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
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
        remoteHabitRepository,
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

          syncRemoteReminder({ habitId: habit.id, habitName: habit.name, time: reminder.time }).catch(() => undefined);
          habit = await editHabit(habit, { reminderTime: reminder.time }, remoteHabitRepository);
        } catch (error) {
          setIsSuccess(false);
          setMessage(`Hábito creado sin recordatorio. ${getReminderMessage(error)}`);
          return;
        }
      }

      setIsSuccess(true);
      setMessage('Hábito creado.');
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
        keyboardAvoiding
      >
      <AppHeader
        backLabel="Hábitos"
        description="Define una acción diaria sencilla para empezar a medirla."
        eyebrow="Nuevo hábito"
        onBack={() => router.back()}
        title="Crear hábito"
      />

      <Card style={styles.form}>
        <TextInputField label="Nombre" onChangeText={setHabitName} placeholder="Leer" value={habitName} />

        <SelectPill label="Diaria" onPress={() => setHabitFrequency('daily')} selected={habitFrequency === 'daily'} />

        <TextInputField
          label="Categoría opcional"
          onChangeText={setHabitCategory}
          placeholder="estudio"
          value={habitCategory}
        />

        <TextInputField
          label="Meta opcional"
          onChangeText={setHabitTarget}
          placeholder="leer 10 páginas"
          value={habitTarget}
        />

        <TextInputField
          inputMode="numeric"
          label="Recordatorio inicial opcional"
          onChangeText={setHabitReminderTime}
          placeholder="08:00"
          value={habitReminderTime}
        />

        {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

        <PrimaryButton
          icon="save"
          loading={isSubmitting}
          onPress={handleCreateHabit}
          title="Guardar hábito"
        />
      </Card>
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
  form: {
    gap: spacing.lg,
  },
});
