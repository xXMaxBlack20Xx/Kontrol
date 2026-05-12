import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deleteHabitReminder,
  ReminderError,
  saveHabitReminder,
  validateReminderTime,
} from './reminder.ts';
import type {
  ReminderNotificationScheduler,
  ReminderPermissionStatus,
  ReminderRecord,
  ReminderRepository,
} from './reminder.ts';

function createMemoryRepository(initialReminders: ReminderRecord[] = []): ReminderRepository {
  const reminders = [...initialReminders];

  return {
    async findByHabitId(habitId) {
      return reminders.find((reminder) => reminder.habitId === habitId) ?? null;
    },
    async listByAccount(accountId) {
      return reminders.filter((reminder) => reminder.accountId === accountId);
    },
    async upsert(reminder) {
      const reminderIndex = reminders.findIndex(
        (storedReminder) => storedReminder.habitId === reminder.habitId,
      );

      if (reminderIndex < 0) {
        reminders.push(reminder);
        return;
      }

      reminders[reminderIndex] = reminder;
    },
    async removeByHabitId(habitId) {
      const reminderIndex = reminders.findIndex((reminder) => reminder.habitId === habitId);

      if (reminderIndex < 0) {
        return false;
      }

      reminders.splice(reminderIndex, 1);

      return true;
    },
  };
}

function createScheduler(permissionStatus: ReminderPermissionStatus = 'granted'): ReminderNotificationScheduler & {
  scheduledTimes: string[];
  canceledIds: string[];
} {
  const scheduledTimes: string[] = [];
  const canceledIds: string[] = [];

  return {
    scheduledTimes,
    canceledIds,
    async requestPermission() {
      return permissionStatus;
    },
    async scheduleDailyReminder({ time }) {
      scheduledTimes.push(time);
      return `notification-${scheduledTimes.length}`;
    },
    async cancelReminder(notificationId) {
      canceledIds.push(notificationId);
    },
  };
}

function createReminder(): ReminderRecord {
  return {
    id: 'reminder-1',
    accountId: 'account-1',
    habitId: 'habit-1',
    time: '08:00',
    notificationId: 'notification-1',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  };
}

test('CP-10 happy path creates a local reminder for a habit', async () => {
  const repository = createMemoryRepository();
  const scheduler = createScheduler();

  const reminder = await saveHabitReminder(
    {
      accountId: 'account-1',
      habitId: 'habit-1',
      habitName: 'Leer',
      time: '08:00',
    },
    repository,
    scheduler,
  );

  assert.equal(reminder.time, '08:00');
  assert.equal(reminder.notificationId, 'notification-1');
  assert.deepEqual(scheduler.scheduledTimes, ['08:00']);
  assert.deepEqual(await repository.listByAccount('account-1'), [reminder]);
});

test('CP-10 alternate path edits an existing reminder', async () => {
  const reminder = createReminder();
  const repository = createMemoryRepository([reminder]);
  const scheduler = createScheduler();

  const updatedReminder = await saveHabitReminder(
    {
      accountId: 'account-1',
      habitId: 'habit-1',
      habitName: 'Leer',
      time: '09:00',
    },
    repository,
    scheduler,
  );

  assert.equal(updatedReminder.id, reminder.id);
  assert.equal(updatedReminder.time, '09:00');
  assert.deepEqual(scheduler.canceledIds, ['notification-1']);
  assert.deepEqual(scheduler.scheduledTimes, ['09:00']);
});

test('CP-10 alternate path deletes an existing reminder after confirmation', async () => {
  const reminder = createReminder();
  const repository = createMemoryRepository([reminder]);
  const scheduler = createScheduler();

  const deletedReminder = await deleteHabitReminder(
    { habitId: 'habit-1', confirmed: true },
    repository,
    scheduler,
  );

  assert.equal(deletedReminder.id, reminder.id);
  assert.deepEqual(scheduler.canceledIds, ['notification-1']);
  assert.deepEqual(await repository.listByAccount('account-1'), []);
});

test('CP-10 failure path rejects missing habit, invalid time and missing permission', async () => {
  const repository = createMemoryRepository();

  assert.equal(validateReminderTime('24:00'), 'TIME_INVALID');
  assert.equal(validateReminderTime(''), 'TIME_REQUIRED');

  await assert.rejects(
    saveHabitReminder(
      {
        accountId: 'account-1',
        habitId: '',
        habitName: 'Leer',
        time: '08:00',
      },
      repository,
      createScheduler(),
    ),
    (error) => error instanceof ReminderError && error.code === 'HABIT_REQUIRED',
  );

  await assert.rejects(
    saveHabitReminder(
      {
        accountId: 'account-1',
        habitId: 'habit-1',
        habitName: 'Leer',
        time: '08:00',
      },
      repository,
      createScheduler('denied'),
    ),
    (error) =>
      error instanceof ReminderError && error.code === 'NOTIFICATION_PERMISSION_REQUIRED',
  );

  await assert.rejects(
    saveHabitReminder(
      {
        accountId: 'account-1',
        habitId: 'habit-1',
        habitName: 'Leer',
        time: '08:00',
      },
      repository,
      createScheduler('unavailable'),
    ),
    (error) => error instanceof ReminderError && error.code === 'NOTIFICATIONS_UNAVAILABLE',
  );

  assert.deepEqual(await repository.listByAccount('account-1'), []);
});
