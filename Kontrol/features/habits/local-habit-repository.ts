import { Directory, File, Paths } from 'expo-file-system';

import type { HabitRecord, HabitRepository } from './habit';

type HabitStorage = {
  habits: HabitRecord[];
};

const storageDirectory = new Directory(Paths.document, 'kontrol');
const habitsFile = new File(storageDirectory, 'habits.json');

function ensureStorage(): void {
  storageDirectory.create({ idempotent: true, intermediates: true });

  if (!habitsFile.exists) {
    habitsFile.write(JSON.stringify({ habits: [] }));
  }
}

async function readStorage(): Promise<HabitStorage> {
  ensureStorage();

  const rawStorage = await habitsFile.text();

  try {
    const parsedStorage = JSON.parse(rawStorage) as HabitStorage;

    return {
      habits: Array.isArray(parsedStorage.habits) ? parsedStorage.habits : [],
    };
  } catch {
    return { habits: [] };
  }
}

async function writeStorage(storage: HabitStorage): Promise<void> {
  ensureStorage();
  habitsFile.write(JSON.stringify(storage));
}

export const fileHabitRepository: HabitRepository = {
  async create(habit) {
    const storage = await readStorage();
    await writeStorage({ habits: [...storage.habits, habit] });
  },
  async update(habit) {
    const storage = await readStorage();

    await writeStorage({
      habits: storage.habits.map((storedHabit) =>
        storedHabit.id === habit.id ? habit : storedHabit,
      ),
    });
  },
  async remove(habitId) {
    const storage = await readStorage();
    const habits = storage.habits.filter((habit) => habit.id !== habitId);

    if (habits.length === storage.habits.length) {
      return false;
    }

    await writeStorage({ habits });

    return true;
  },
  async listByAccount(accountId) {
    const storage = await readStorage();

    return storage.habits.filter((habit) => habit.accountId === accountId);
  },
};

export async function clearLocalHabitsForTests(): Promise<void> {
  await writeStorage({ habits: [] });
}
