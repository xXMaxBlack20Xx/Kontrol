import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import type { LoginRepository } from './login';
import type { AccountRecord, SessionRecord } from './registration';

type AccountStorage = {
  accounts: AccountRecord[];
  activeSession: SessionRecord | null;
};

const storageDirectory = new Directory(Paths.document, 'kontrol');
const accountsFile = new File(storageDirectory, 'accounts.json');
const sessionStorageKey = 'kontrol.activeSession';

function ensureStorage(): void {
  storageDirectory.create({ idempotent: true, intermediates: true });

  if (!accountsFile.exists) {
    accountsFile.write(JSON.stringify({ accounts: [], activeSession: null }));
  }
}

async function readStorage(): Promise<AccountStorage> {
  ensureStorage();

  const rawStorage = await accountsFile.text();

  try {
    const parsedStorage = JSON.parse(rawStorage) as AccountStorage;

    return {
      accounts: Array.isArray(parsedStorage.accounts) ? parsedStorage.accounts : [],
      activeSession: parsedStorage.activeSession ?? null,
    };
  } catch {
    return { accounts: [], activeSession: null };
  }
}

async function writeStorage(storage: AccountStorage): Promise<void> {
  ensureStorage();
  accountsFile.write(JSON.stringify(storage));
}

function parseSession(rawSession: string | null): SessionRecord | null {
  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as SessionRecord;

    if (
      typeof parsedSession.accountId === 'string' &&
      typeof parsedSession.email === 'string' &&
      typeof parsedSession.createdAt === 'string'
    ) {
      return parsedSession;
    }
  } catch {
    return null;
  }

  return null;
}

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function saveSecureSession(session: SessionRecord): Promise<boolean> {
  if (!(await canUseSecureStore())) {
    return false;
  }

  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return true;
}

async function getSecureSession(): Promise<SessionRecord | null> {
  if (!(await canUseSecureStore())) {
    return null;
  }

  const rawSession = await SecureStore.getItemAsync(sessionStorageKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return parseSession(rawSession);
}

async function clearSecureSession(): Promise<void> {
  if (!(await canUseSecureStore())) {
    return;
  }

  await SecureStore.deleteItemAsync(sessionStorageKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export const fileAccountRepository: LoginRepository = {
  async findByEmail(email) {
    const storage = await readStorage();

    return storage.accounts.find((account) => account.email === email) ?? null;
  },
  async create(account) {
    const storage = await readStorage();
    await writeStorage({ ...storage, accounts: [...storage.accounts, account] });
  },
  async saveSession(session) {
    const storage = await readStorage();
    const didSaveSecurely = await saveSecureSession(session);

    await writeStorage({ ...storage, activeSession: didSaveSecurely ? null : session });
  },
  async getActiveSession() {
    const secureSession = await getSecureSession();

    if (secureSession) {
      return secureSession;
    }

    const storage = await readStorage();

    return storage.activeSession;
  },
  async clearSession() {
    const storage = await readStorage();
    await clearSecureSession();
    await writeStorage({ ...storage, activeSession: null });
  },
};

export async function clearLocalAccountsForTests(): Promise<void> {
  await writeStorage({ accounts: [], activeSession: null });
}
