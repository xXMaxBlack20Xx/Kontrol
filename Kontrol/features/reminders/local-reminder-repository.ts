import { Directory, File, Paths } from 'expo-file-system';

import type { ReminderRecord, ReminderRepository } from './reminder';

type ReminderStorage = {
  reminders: ReminderRecord[];
};

const storageDirectory = new Directory(Paths.document, 'kontrol');
const remindersFile = new File(storageDirectory, 'reminders.json');

function ensureStorage(): void {
  storageDirectory.create({ idempotent: true, intermediates: true });

  if (!remindersFile.exists) {
    remindersFile.write(JSON.stringify({ reminders: [] }));
  }
}

async function readStorage(): Promise<ReminderStorage> {
  ensureStorage();

  const rawStorage = await remindersFile.text();

  try {
    const parsedStorage = JSON.parse(rawStorage) as ReminderStorage;

    return {
      reminders: Array.isArray(parsedStorage.reminders) ? parsedStorage.reminders : [],
    };
  } catch {
    return { reminders: [] };
  }
}

async function writeStorage(storage: ReminderStorage): Promise<void> {
  ensureStorage();
  remindersFile.write(JSON.stringify(storage));
}

export const fileReminderRepository: ReminderRepository = {
  async findByHabitId(habitId) {
    const storage = await readStorage();

    return storage.reminders.find((reminder) => reminder.habitId === habitId) ?? null;
  },
  async listByAccount(accountId) {
    const storage = await readStorage();

    return storage.reminders.filter((reminder) => reminder.accountId === accountId);
  },
  async upsert(reminder) {
    const storage = await readStorage();
    const reminderIndex = storage.reminders.findIndex(
      (storedReminder) => storedReminder.habitId === reminder.habitId,
    );

    if (reminderIndex < 0) {
      await writeStorage({ reminders: [...storage.reminders, reminder] });
      return;
    }

    await writeStorage({
      reminders: storage.reminders.map((storedReminder, index) =>
        index === reminderIndex ? reminder : storedReminder,
      ),
    });
  },
  async removeByHabitId(habitId) {
    const storage = await readStorage();
    const reminders = storage.reminders.filter((reminder) => reminder.habitId !== habitId);

    if (reminders.length === storage.reminders.length) {
      return false;
    }

    await writeStorage({ reminders });

    return true;
  },
};

export async function clearLocalRemindersForTests(): Promise<void> {
  await writeStorage({ reminders: [] });
}
