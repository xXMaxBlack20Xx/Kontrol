import * as SecureStore from 'expo-secure-store';

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  createdAt: string;
};

const sessionStorageKey = 'kontrol.apiSession';

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function parseStoredSession(rawSession: string | null): StoredAuthSession | null {
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as StoredAuthSession;

    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string' &&
      typeof parsed.createdAt === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function saveStoredAuthSession(session: StoredAuthSession): Promise<void> {
  if (!(await canUseSecureStore())) {
    throw new Error('SecureStore is not available on this device.');
  }

  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  if (!(await canUseSecureStore())) {
    return null;
  }

  const rawSession = await SecureStore.getItemAsync(sessionStorageKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return parseStoredSession(rawSession);
}

export async function clearStoredAuthSession(): Promise<void> {
  if (!(await canUseSecureStore())) {
    return;
  }

  await SecureStore.deleteItemAsync(sessionStorageKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
