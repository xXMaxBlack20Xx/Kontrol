import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fileAccountRepository } from './local-account-repository';
import {
  clearActiveLocalSession,
  getActiveLocalSession,
  loginLocalAccount,
  type LoginInput,
} from './login';
import { hashPassword, verifyPassword } from './password';
import { registerLocalAccount, type RegistrationInput, type SessionRecord } from './registration';

type AuthContextValue = {
  user: SessionRecord | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  register(input: RegistrationInput): Promise<void>;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  restoreSession(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createSession(accountId: string, email: string): SessionRecord {
  return {
    accountId,
    email,
    createdAt: new Date().toISOString(),
  };
}

async function getValidatedSession(): Promise<SessionRecord | null> {
  const activeSession = await getActiveLocalSession(fileAccountRepository);

  if (!activeSession) {
    return null;
  }

  const account = await fileAccountRepository.findByEmail(activeSession.email);

  if (!account || account.id !== activeSession.accountId) {
    await clearActiveLocalSession(fileAccountRepository);
    return null;
  }

  return activeSession;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionRecord | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsLoadingSession(true);

    try {
      setUser(await getValidatedSession());
    } catch {
      setUser(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const register = useCallback(async (input: RegistrationInput) => {
    const account = await registerLocalAccount(input, fileAccountRepository, hashPassword);
    const session = createSession(account.id, account.email);

    await fileAccountRepository.saveSession(session);
    setUser(session);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const session = await loginLocalAccount(input, fileAccountRepository, verifyPassword);

    setUser(session);
  }, []);

  const logout = useCallback(async () => {
    await clearActiveLocalSession(fileAccountRepository);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingSession,
      register,
      login,
      logout,
      restoreSession,
    }),
    [isLoadingSession, login, logout, register, restoreSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
