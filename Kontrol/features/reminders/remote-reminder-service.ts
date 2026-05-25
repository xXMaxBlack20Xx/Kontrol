import { apiDelete, apiGet, apiPost, apiPut } from '@/features/api/api';

export type RemoteReminder = {
  id: string;
  userId: string;
  habitId: string;
  title: string;
  time: string;
  daysOfWeek: number[];
  enabled: boolean;
  timezone: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

const everyDay = [0, 1, 2, 3, 4, 5, 6];

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export async function listRemoteReminders(): Promise<RemoteReminder[]> {
  const response = await apiGet<{ reminders: RemoteReminder[] }>('/reminders');

  return response.reminders;
}

export async function syncRemoteReminder(input: { habitId: string; habitName: string; time: string }): Promise<void> {
  const reminders = await listRemoteReminders();
  const existingReminder = reminders.find((reminder) => reminder.habitId === input.habitId);
  const body = {
    title: input.habitName.trim() || 'Hábito',
    time: input.time,
    daysOfWeek: everyDay,
    enabled: true,
    timezone: getTimezone(),
  };

  if (existingReminder) {
    await apiPut<{ reminder: RemoteReminder }>(`/reminders/${encodeURIComponent(existingReminder.id)}`, body);
    return;
  }

  await apiPost<{ reminder: RemoteReminder }>('/reminders', {
    ...body,
    habitId: input.habitId,
  });
}

export async function deleteRemoteReminderByHabitId(habitId: string): Promise<void> {
  const reminders = await listRemoteReminders();
  const existingReminder = reminders.find((reminder) => reminder.habitId === habitId);

  if (!existingReminder) {
    return;
  }

  await apiDelete<{ success: boolean }>(`/reminders/${encodeURIComponent(existingReminder.id)}`);
}
