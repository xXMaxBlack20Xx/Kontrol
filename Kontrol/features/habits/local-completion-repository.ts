import { Directory, File, Paths } from 'expo-file-system';

import type { HabitCompletionRecord, HabitCompletionRepository } from './completion';

type CompletionStorage = {
  completions: HabitCompletionRecord[];
};

const storageDirectory = new Directory(Paths.document, 'kontrol');
const completionsFile = new File(storageDirectory, 'completions.json');

function ensureStorage(): void {
  storageDirectory.create({ idempotent: true, intermediates: true });

  if (!completionsFile.exists) {
    completionsFile.write(JSON.stringify({ completions: [] }));
  }
}

async function readStorage(): Promise<CompletionStorage> {
  ensureStorage();

  const rawStorage = await completionsFile.text();

  try {
    const parsedStorage = JSON.parse(rawStorage) as CompletionStorage;

    return {
      completions: Array.isArray(parsedStorage.completions) ? parsedStorage.completions : [],
    };
  } catch {
    return { completions: [] };
  }
}

async function writeStorage(storage: CompletionStorage): Promise<void> {
  ensureStorage();
  completionsFile.write(JSON.stringify(storage));
}

export const fileCompletionRepository: HabitCompletionRepository = {
  async create(completion) {
    const storage = await readStorage();
    const alreadyExists = storage.completions.some(
      (storedCompletion) =>
        storedCompletion.habitId === completion.habitId &&
        storedCompletion.completedOn === completion.completedOn,
    );

    if (alreadyExists) {
      return;
    }

    await writeStorage({ completions: [...storage.completions, completion] });
  },
  async findByHabitDate(habitId, completedOn) {
    const storage = await readStorage();

    return (
      storage.completions.find(
        (completion) => completion.habitId === habitId && completion.completedOn === completedOn,
      ) ?? null
    );
  },
  async listByAccount(accountId) {
    const storage = await readStorage();

    return storage.completions.filter((completion) => completion.accountId === accountId);
  },
  async listByHabit(habitId) {
    const storage = await readStorage();

    return storage.completions.filter((completion) => completion.habitId === habitId);
  },
};

export async function clearLocalCompletionsForTests(): Promise<void> {
  await writeStorage({ completions: [] });
}
