import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { SecondaryButton } from '@/components/ui/buttons';
import { LinearGradient } from 'expo-linear-gradient';
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

function parseReminderTime(timeStr: string) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let [, hoursStr, minutesStr, ampm] = match;
    let hours = parseInt(hoursStr, 10);
    if (!ampm) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
    }
    const formattedHours = hours.toString().padStart(2, '0');
    return {
      time: `${formattedHours}:${minutesStr}`,
      period: ampm.toUpperCase(),
    };
  }
  return { time: timeStr, period: '' };
}

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

  const showInfoAlert = () => {
    Alert.alert(
      'Acerca de Recordatorios',
      'Revisa las notificaciones locales configuradas para tus hábitos diarios.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

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
        <View style={styles.heroBlock}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppHeader title="Recordatorios" />
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

        {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={styles.loadingText}>Cargando recordatorios...</Text>
          </View>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons color={colors.textTertiary} name="notifications-none" size={64} />
            </View>
            <Text style={styles.emptyTitle}>Sin recordatorios</Text>
            <Text style={styles.emptyDescription}>
              Crea o edita un hábito para agregar una hora de recordatorio local y recibir notificaciones.
            </Text>
            <SecondaryButton
              compact={false}
              fullWidth={false}
              icon="add-alarm"
              onPress={() => router.push('/(app)/habits/create' as Href)}
              title="Agregar recordatorio"
              style={styles.emptyButton}
            />
          </View>
        ) : null}

        {items.map((item) => {
          const habit = item.habit;
          const isDeleting = deletingHabitId === item.reminder.habitId;
          const parsed = parseReminderTime(item.reminder.time);

          return (
            <Pressable
              key={item.reminder.id}
              accessibilityLabel={`Recordatorio para ${habit?.name ?? 'Hábito no disponible'} a las ${item.reminder.time}`}
              accessibilityRole="button"
              onPress={habit ? () => router.push(habitEditHref(habit.id)) : undefined}
              style={({ pressed }) => [
                styles.reminderCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.reminderContent}>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{parsed.time}</Text>
                  {parsed.period ? (
                    <Text style={styles.periodText}>{parsed.period}</Text>
                  ) : null}
                </View>
                <Text style={styles.habitName}>
                  {habit?.name ?? 'Hábito no disponible'}
                </Text>
                <Text style={styles.notificationDetail}>
                  Notificación: {item.reminder.notificationId}
                </Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={true}
                  onValueChange={() => confirmDeleteReminder(item)}
                  trackColor={{ false: colors.borderStrong, true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? (isDeleting ? colors.textTertiary : colors.primary) : undefined}
                  ios_backgroundColor={colors.borderStrong}
                  disabled={isDeleting}
                />
              </View>
            </Pressable>
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
  reminderCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  reminderContent: {
    flex: 1,
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeText: {
    fontFamily: typography.fontFamilyRound,
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  periodText: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 4,
  },
  habitName: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  notificationDetail: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: spacing.md,
  },
  emptyIconContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  emptyButton: {
    alignSelf: 'center',
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
    opacity: 0.8,
  },
});
