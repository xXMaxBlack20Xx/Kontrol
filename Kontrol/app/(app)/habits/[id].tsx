import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';
import {
  buildHabitDetailSummary,
  CompleteHabitError,
  completeHabitErrorMessages,
  completeHabitForToday,
  type HabitDetailSummary,
} from '@/features/habits/completion';
import type { HabitRecord } from '@/features/habits/habit';
import { fileCompletionRepository } from '@/features/habits/local-completion-repository';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';
import { habitEditHref } from '@/features/navigation/routes';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import type { ReminderRecord } from '@/features/reminders/reminder';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
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
        fileHabitRepository.listByAccount(user.accountId),
        fileCompletionRepository.listByHabit(habitId),
        fileReminderRepository.findByHabitId(habitId),
      ]);
      const selectedHabit = storedHabits.find((currentHabit) => currentHabit.id === habitId) ?? null;
      const detail = buildHabitDetailSummary(selectedHabit, completions);

      setHabit(selectedHabit);
      setHabitDetail(detail);
      setReminder(storedReminder);

      if (!detail) {
        setMessage('El habito ya no esta disponible. Regresa a la lista principal.');
      }
    } catch {
      setHabit(null);
      setHabitDetail(null);
      setReminder(null);
      setMessage('No se pudo abrir el detalle del habito. Intenta nuevamente.');
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
      const result = await completeHabitForToday(habit, fileCompletionRepository);
      const completions = await fileCompletionRepository.listByHabit(habit.id);

      setHabitDetail(buildHabitDetailSummary(habit, completions));
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
      setIsCompleting(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons color="#0A84FF" name="arrow-back-ios-new" size={18} />
          <Text style={styles.backButtonText}>Habitos</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Detalle del habito</Text>
        <Text style={styles.title}>{habitDetail?.habit.name ?? 'Habito'}</Text>
      </View>

      {message ? (
        <Text style={[styles.feedback, isSuccess ? styles.success : styles.error]}>{message}</Text>
      ) : null}

      {isLoading ? <ActivityIndicator color="#0A84FF" /> : null}

      {habitDetail ? (
        <View style={styles.card}>
          <Text style={styles.habitDetail}>Frecuencia: diaria</Text>
          {habitDetail.habit.category ? (
            <Text style={styles.habitDetail}>Categoria: {habitDetail.habit.category}</Text>
          ) : null}
          {habitDetail.habit.target ? (
            <Text style={styles.habitDetail}>Meta: {habitDetail.habit.target}</Text>
          ) : null}
          {reminder?.time ? <Text style={styles.habitDetail}>Recordatorio: {reminder.time}</Text> : null}
          <Text style={styles.habitDetail}>
            Estado de hoy: {habitDetail.completedToday ? 'completado' : 'pendiente'}
          </Text>
          <Text style={styles.habitDetail}>Racha actual: {habitDetail.currentStreak} dia(s)</Text>

          <View style={styles.actions}>
            <Pressable
              disabled={habitDetail.completedToday || isCompleting}
              onPress={handleCompleteHabit}
              style={({ pressed }) => [
                styles.primaryButton,
                habitDetail.completedToday && styles.completeButtonDone,
                (pressed || isCompleting) && styles.buttonPressed,
              ]}>
              <MaterialIcons color="#FFFFFF" name={habitDetail.completedToday ? 'done' : 'check'} size={20} />
              <Text style={styles.primaryButtonText}>
                {habitDetail.completedToday ? 'Completado' : 'Completar hoy'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(habitEditHref(habitDetail.habit.id))}
              style={styles.secondaryButton}>
              <MaterialIcons color="#0A84FF" name="edit" size={20} />
              <Text style={styles.secondaryButtonText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.historyBlock}>
            <Text style={styles.historyTitle}>Historial basico</Text>
            {habitDetail.hasEnoughHistory ? (
              habitDetail.historyDates.map((completedOn) => (
                <Text key={completedOn} style={styles.historyItem}>
                  Cumplido el {completedOn}
                </Text>
              ))
            ) : (
              <Text style={styles.historyEmpty}>Todavia no hay historial suficiente para este habito.</Text>
            )}
          </View>
        </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 8,
    padding: 18,
  },
  habitDetail: {
    color: '#6E6E73',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
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
  completeButtonDone: {
    backgroundColor: '#34C759',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#0A84FF',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  historyBlock: {
    borderTopColor: '#E5E5EA',
    borderTopWidth: 1,
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
  },
  historyTitle: {
    color: '#1D1D1F',
    fontSize: 17,
    fontWeight: '700',
  },
  historyItem: {
    color: '#3A3A3C',
    fontSize: 14,
    lineHeight: 20,
  },
  historyEmpty: {
    color: '#6E6E73',
    fontSize: 14,
    lineHeight: 20,
  },
});
