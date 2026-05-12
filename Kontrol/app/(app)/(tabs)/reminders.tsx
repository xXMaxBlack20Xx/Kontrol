import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { useAuth } from '@/features/account/auth-context';
import { editHabit, type HabitRecord } from '@/features/habits/habit';
import { fileHabitRepository } from '@/features/habits/local-habit-repository';
import { habitEditHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import { deleteHabitReminder, type ReminderRecord } from '@/features/reminders/reminder';

type ReminderListItem = {
  habit: HabitRecord | null;
  reminder: ReminderRecord;
};

export default function RemindersScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
      const [habits, reminders] = await Promise.all([
        fileHabitRepository.listByAccount(user.accountId),
        fileReminderRepository.listByAccount(user.accountId),
      ]);

      setItems(
        reminders.map((reminder) => ({
          habit: habits.find((currentHabit) => currentHabit.id === reminder.habitId) ?? null,
          reminder,
        })),
      );
    } catch {
      setItems([]);
      setIsSuccess(false);
      setMessage('No se pudieron cargar tus recordatorios locales. Intenta nuevamente.');
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
    Alert.alert('Eliminar recordatorio', 'Confirma para retirar esta notificacion local.', [
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
      await deleteHabitReminder(
        { habitId: item.reminder.habitId, confirmed: true },
        fileReminderRepository,
        expoNotificationScheduler,
      );

      if (item.habit) {
        await editHabit(item.habit, { reminderTime: '' }, fileHabitRepository);
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Kontrol</Text>
        <Text style={styles.title}>Recordatorios</Text>
        <Text style={styles.description}>
          Revisa las notificaciones locales configuradas para tus habitos diarios.
        </Text>
      </View>

      {message ? (
        <Text style={[styles.feedback, isSuccess ? styles.success : styles.error]}>{message}</Text>
      ) : null}

      {isLoading ? <ActivityIndicator color="#0A84FF" /> : null}

      {!isLoading && items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin recordatorios</Text>
          <Text style={styles.emptyText}>
            Crea o edita un habito para agregar una hora de recordatorio local.
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/habits/create' as Href)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <MaterialIcons color="#0A84FF" name="add-circle-outline" size={20} />
            <Text style={styles.secondaryButtonText}>Crear habito</Text>
          </Pressable>
        </View>
      ) : null}

      {items.map((item) => {
        const habit = item.habit;

        return (
          <View key={item.reminder.id} style={styles.card}>
            <Text style={styles.habitName}>{habit?.name ?? 'Habito no disponible'}</Text>
            <Text style={styles.habitDetail}>Hora: {item.reminder.time}</Text>
            <Text style={styles.habitDetail}>Notificacion local: {item.reminder.notificationId}</Text>

            <View style={styles.actions}>
              {habit ? (
                <Pressable
                  onPress={() => router.push(habitEditHref(habit.id))}
                  style={styles.secondaryButton}>
                  <MaterialIcons color="#0A84FF" name="edit" size={20} />
                  <Text style={styles.secondaryButtonText}>Editar habito</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={deletingHabitId === item.reminder.habitId}
                onPress={() => confirmDeleteReminder(item)}
                style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}>
                <MaterialIcons color="#FFFFFF" name="notifications-off" size={20} />
                <Text style={styles.dangerButtonText}>
                  {deletingHabitId === item.reminder.habitId ? 'Eliminando' : 'Eliminar'}
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
    marginBottom: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 6,
    padding: 16,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
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
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#B3261E',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
