import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { colors, radius, spacing } from '@/components/ui/theme';
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
      const result = await completeHabitForToday(habit, fileCompletionRepository);
      const completions = await fileCompletionRepository.listByHabit(habit.id);

      setHabitDetail(buildHabitDetailSummary(habit, completions));
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
      setIsCompleting(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  return (
    <ScreenContainer contentStyle={styles.content} edges={['top']}>
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
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado de hoy</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {habitDetail.completedToday ? 'Completado' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <View style={styles.detailList}>
            <Text style={styles.habitDetail}>Frecuencia: diaria</Text>
            {habitDetail.habit.category ? (
              <Text style={styles.habitDetail}>Categoría: {habitDetail.habit.category}</Text>
            ) : null}
            {habitDetail.habit.target ? (
              <Text style={styles.habitDetail}>Meta: {habitDetail.habit.target}</Text>
            ) : null}
            {reminder?.time ? <Text style={styles.habitDetail}>Recordatorio: {reminder.time}</Text> : null}
            <Text style={styles.habitDetail}>Racha actual: {habitDetail.currentStreak} día(s)</Text>
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
  card: {
    gap: spacing.lg,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
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
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  detailList: {
    gap: 5,
  },
  habitDetail: {
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
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  historyItem: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  historyEmpty: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
