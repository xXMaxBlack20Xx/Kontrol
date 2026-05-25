import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiAccessToken, setApiAccessToken, setApiRefreshHandler } from '@/features/api/api';

import type { ApiUser } from './auth-service';
import {
  getMeWithApi,
  loginWithApi,
  logoutWithApi,
  refreshWithApi,
  registerWithApi,
  type AuthTokensResponse,
} from './auth-service';
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  saveStoredAuthSession,
  type StoredAuthSession,
} from './secure-session-storage';
import {
  LoginError,
  type LoginInput,
  validateLoginInput,
} from './login';
import { RegistrationError, type RegistrationInput, validateRegistrationInput } from './registration';

type AuthenticatedUser = ApiUser & {
  accountId: string;
  createdAt: string;
};

type ActiveAuthSession = StoredAuthSession & {
  user: ApiUser;
};

function isActiveAuthSession(session: StoredAuthSession | ActiveAuthSession): session is ActiveAuthSession {
  return 'user' in session && typeof session.user.userId === 'string' && typeof session.user.email === 'string';
}

type AuthContextValue = {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoadingSession: boolean;
  register(input: RegistrationInput): Promise<void>;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  restoreSession(): Promise<void>;
  loadSession(): Promise<void>;
  clearSession(): Promise<void>;
  refreshSession(): Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthenticatedUser(user: ApiUser, createdAt: string): AuthenticatedUser {
  return {
    ...user,
    accountId: user.userId,
    createdAt,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const sessionRef = useRef<ActiveAuthSession | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const clearSessionState = useCallback(async () => {
    sessionRef.current = null;
    setApiAccessToken(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUser(null);
    await clearStoredAuthSession();
  }, []);

  const applySession = useCallback(async (session: ActiveAuthSession) => {
    sessionRef.current = session;
    setApiAccessToken(session.accessToken);
    setAccessTokenState(session.accessToken);
    setRefreshTokenState(session.refreshToken);
    setUser(toAuthenticatedUser(session.user, session.createdAt));
    await saveStoredAuthSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      createdAt: session.createdAt,
    });
  }, []);

  const applyAuthResponse = useCallback(async (response: AuthTokensResponse) => {
    await applySession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      createdAt: new Date().toISOString(),
    });
  }, [applySession]);

  const refreshSession = useCallback(async () => {
    const storedSession = sessionRef.current ?? await getStoredAuthSession();

    if (!storedSession?.refreshToken) {
      await clearSessionState();
      return null;
    }

    try {
      const refreshedSession = await refreshWithApi(storedSession.refreshToken);
      const nextSession = {
        ...storedSession,
        accessToken: refreshedSession.accessToken,
      };

      setApiAccessToken(nextSession.accessToken);
      setAccessTokenState(nextSession.accessToken);
      setRefreshTokenState(nextSession.refreshToken);
      await saveStoredAuthSession({
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
        createdAt: nextSession.createdAt,
      });

      if (isActiveAuthSession(nextSession)) {
        sessionRef.current = nextSession;
      }

      return nextSession.accessToken;
    } catch {
      await clearSessionState();
      return null;
    }
  }, [clearSessionState]);

  useEffect(() => {
    setApiRefreshHandler(refreshSession);

    return () => setApiRefreshHandler(null);
  }, [refreshSession]);

  const restoreSession = useCallback(async () => {
    setIsLoadingSession(true);

    try {
      const storedSession = await getStoredAuthSession();

      if (!storedSession) {
        await clearSessionState();
        return;
      }

      setApiAccessToken(storedSession.accessToken);
      setAccessTokenState(storedSession.accessToken);
      setRefreshTokenState(storedSession.refreshToken);

      let apiUser: ApiUser;

      try {
        apiUser = await getMeWithApi();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && await refreshSession()) {
          apiUser = await getMeWithApi();
        } else {
          throw error;
        }
      }

      await applySession({ ...storedSession, accessToken: getApiAccessToken() ?? storedSession.accessToken, user: apiUser });
    } catch {
      await clearSessionState();
    } finally {
      setIsLoadingSession(false);
    }
  }, [applySession, clearSessionState, refreshSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const register = useCallback(async (input: RegistrationInput) => {
    const validationError = validateRegistrationInput(input);

    if (validationError) {
      throw new RegistrationError(validationError);
    }

    try {
      await applyAuthResponse(await registerWithApi({ email: input.email.trim().toLowerCase(), password: input.password }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new RegistrationError('DUPLICATE_EMAIL');
      }

      if (error instanceof RegistrationError) {
        throw error;
      }

      throw new RegistrationError('REGISTRATION_UNAVAILABLE');
    }
  }, [applyAuthResponse]);

  const login = useCallback(async (input: LoginInput) => {
    const validationError = validateLoginInput(input);

    if (validationError) {
      throw new LoginError(validationError);
    }

    try {
      await applyAuthResponse(await loginWithApi({ email: input.email.trim().toLowerCase(), password: input.password }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new LoginError('INVALID_CREDENTIALS');
      }

      if (error instanceof LoginError) {
        throw error;
      }

      throw new LoginError('LOGIN_UNAVAILABLE');
    }
  }, [applyAuthResponse]);

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;

    try {
      if (refreshToken) {
        await logoutWithApi(refreshToken);
      }
    } catch {
      // Local session cleanup must still protect private screens if the network request fails.
    } finally {
      await clearSessionState();
    }
  }, [clearSessionState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user),
      isLoading: isLoadingSession,
      isLoadingSession,
      register,
      login,
      logout,
      restoreSession,
      loadSession: restoreSession,
      clearSession: clearSessionState,
      refreshSession,
    }),
    [accessToken, clearSessionState, isLoadingSession, login, logout, refreshSession, refreshToken, register, restoreSession, user],
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
