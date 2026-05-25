import type { AccountRepository, SessionRecord } from './registration';

export type LoginInput = {
  email: string;
  password: string;
};

export type SessionRepository = {
  saveSession(session: SessionRecord): Promise<void>;
  getActiveSession(): Promise<SessionRecord | null>;
  clearSession(): Promise<void>;
};

export type LoginRepository = AccountRepository & SessionRepository;

export type PasswordVerifier = (password: string, passwordHash: string) => Promise<boolean>;

export type LoginErrorCode = 'INVALID_EMAIL' | 'PASSWORD_REQUIRED' | 'INVALID_CREDENTIALS' | 'LOGIN_UNAVAILABLE';

export const loginErrorMessages: Record<LoginErrorCode, string> = {
  INVALID_EMAIL: 'Ingresa un correo electrónico válido.',
  PASSWORD_REQUIRED: 'Ingresa tu contraseña.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  LOGIN_UNAVAILABLE: 'No se pudo iniciar sesión. Intenta nuevamente.',
};

export class LoginError extends Error {
  code: LoginErrorCode;

  constructor(code: LoginErrorCode) {
    super(loginErrorMessages[code]);
    this.code = code;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginInput(input: LoginInput): LoginErrorCode | null {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) {
    return 'INVALID_EMAIL';
  }

  if (!input.password) {
    return 'PASSWORD_REQUIRED';
  }

  return null;
}

export async function loginLocalAccount(
  input: LoginInput,
  repository: LoginRepository,
  passwordVerifier: PasswordVerifier,
): Promise<SessionRecord> {
  const validationError = validateLoginInput(input);

  if (validationError) {
    throw new LoginError(validationError);
  }

  try {
    const email = normalizeEmail(input.email);
    const account = await repository.findByEmail(email);

    if (!account || !(await passwordVerifier(input.password, account.passwordHash))) {
      throw new LoginError('INVALID_CREDENTIALS');
    }

    const session: SessionRecord = {
      accountId: account.id,
      email: account.email,
      createdAt: new Date().toISOString(),
    };

    await repository.saveSession(session);

    return session;
  } catch (error) {
    if (error instanceof LoginError) {
      throw error;
    }

    throw new LoginError('LOGIN_UNAVAILABLE');
  }
}

export async function getActiveLocalSession(
  repository: SessionRepository,
): Promise<SessionRecord | null> {
  return repository.getActiveSession();
}

export async function clearActiveLocalSession(repository: SessionRepository): Promise<void> {
  await repository.clearSession();
}
