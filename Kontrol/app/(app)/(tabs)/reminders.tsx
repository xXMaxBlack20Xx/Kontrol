import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { DestructiveButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage } from '@/components/ui/form';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import { editHabit, type HabitRecord } from '@/features/habits/habit';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { habitEditHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import { deleteHabitReminder, type ReminderRecord } from '@/features/reminders/reminder';
import { deleteRemoteReminderByHabitId, listRemoteReminders } from '@/features/reminders/remote-reminder-service';

const remoteOnlyNotificationId = 'Metadata remota sin notificación local';

type ReminderListItem = {
  habit: HabitRecord | null;
  reminder: ReminderRecord;
};

export default function RemindersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [items, setItems] = useState<ReminderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const [habits, localReminders, remoteReminders] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        fileReminderRepository.listByAccount(user.accountId),
        listRemoteReminders(),
      ]);
      const localHabitIds = new Set(localReminders.map((reminder) => reminder.habitId));
      const normalizedRemoteReminders: ReminderRecord[] = remoteReminders
        .filter((reminder) => !localHabitIds.has(reminder.habitId))
        .map((reminder) => ({
          id: reminder.id,
          accountId: reminder.userId,
          habitId: reminder.habitId,
          time: reminder.time,
          notificationId: remoteOnlyNotificationId,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt,
        }));
      const reminders = [...localReminders, ...normalizedRemoteReminders];

      setItems(
        reminders.map((reminder) => ({
          habit: habits.find((currentHabit) => currentHabit.id === reminder.habitId) ?? null,
          reminder,
        })),
      );
    } catch {
      setItems([]);
      setIsSuccess(false);
      setMessage('No se pudieron cargar tus recordatorios. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  function confirmDeleteReminder(item: ReminderListItem) {
    Alert.alert('Eliminar recordatorio', 'Confirma para retirar esta notificación local.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: () => handleDeleteReminder(item),
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  async function handleDeleteReminder(item: ReminderListItem) {
    setDeletingHabitId(item.reminder.habitId);
    setMessage(null);
    setIsSuccess(false);

    try {
      if (item.reminder.notificationId === remoteOnlyNotificationId) {
        await deleteRemoteReminderByHabitId(item.reminder.habitId);
      } else {
        await deleteHabitReminder(
          { habitId: item.reminder.habitId, confirmed: true },
          fileReminderRepository,
          expoNotificationScheduler,
        );
        deleteRemoteReminderByHabitId(item.reminder.habitId).catch(() => undefined);
      }

      if (item.habit) {
        await editHabit(item.habit, { reminderTime: '' }, remoteHabitRepository);
      }

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.reminder.habitId !== item.reminder.habitId),
      );
      setIsSuccess(true);
      setMessage('Recordatorio eliminado.');
    } catch {
      setIsSuccess(false);
      setMessage('No se pudo eliminar el recordatorio. Intenta nuevamente.');
    } finally {
      setDeletingHabitId(null);
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
        description="Revisa las notificaciones locales configuradas para tus hábitos diarios."
        title="Recordatorios"
      />

      {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.loadingText}>Cargando recordatorios...</Text>
        </View>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <EmptyState
          action={
            <SecondaryButton
              compact
              fullWidth={false}
              icon="add-circle-outline"
              onPress={() => router.push('/(app)/habits/create' as Href)}
              title="Crear hábito"
            />
          }
          description="Crea o edita un hábito para agregar una hora de recordatorio local."
          icon="notifications-none"
          title="Sin recordatorios"
        />
      ) : null}

      {items.map((item) => {
        const habit = item.habit;
        const isDeleting = deletingHabitId === item.reminder.habitId;

        return (
          <Card key={item.reminder.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.habitName}>{habit?.name ?? 'Hábito no disponible'}</Text>
              <Text style={styles.time}>{item.reminder.time}</Text>
            </View>
            <Text style={styles.habitDetail}>Notificación: {item.reminder.notificationId}</Text>

            <View style={styles.actions}>
              {habit ? (
                <SecondaryButton
                  compact
                  fullWidth={false}
                  icon="edit"
                  onPress={() => router.push(habitEditHref(habit.id))}
                  title="Editar hábito"
                />
              ) : null}
              <DestructiveButton
                compact
                fullWidth={false}
                icon="notifications-off"
                loading={isDeleting}
                onPress={() => confirmDeleteReminder(item)}
                title="Eliminar"
              />
            </View>
          </Card>
        );
      })}
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
    gap: spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  habitName: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  time: {
    fontFamily: typography.fontFamilyRound,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  habitDetail: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
