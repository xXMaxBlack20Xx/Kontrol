export type AccountRecord = {
  id: string;
  email: string;
  passwordHash: string;
  privacyNoticeAcceptedAt: string;
  createdAt: string;
};

export type SessionRecord = {
  accountId: string;
  email: string;
  createdAt: string;
};

export type RegistrationInput = {
  email: string;
  password: string;
  privacyNoticeAccepted: boolean;
};

export type AccountRepository = {
  findByEmail(email: string): Promise<AccountRecord | null>;
  create(account: AccountRecord): Promise<void>;
};

export type PasswordHasher = (password: string) => Promise<string>;

export type RegistrationErrorCode =
  | 'INVALID_EMAIL'
  | 'SHORT_PASSWORD'
  | 'PRIVACY_NOTICE_REQUIRED'
  | 'DUPLICATE_EMAIL'
  | 'REGISTRATION_UNAVAILABLE';

export const registrationErrorMessages: Record<RegistrationErrorCode, string> = {
  INVALID_EMAIL: 'Ingresa un correo electronico valido.',
  SHORT_PASSWORD: 'La contrasena debe tener al menos 8 caracteres.',
  PRIVACY_NOTICE_REQUIRED: 'Acepta el aviso de privacidad para continuar.',
  DUPLICATE_EMAIL: 'Ya existe una cuenta local con ese correo.',
  REGISTRATION_UNAVAILABLE: 'No se pudo completar el registro. Intenta nuevamente.',
};

export class RegistrationError extends Error {
  code: RegistrationErrorCode;

  constructor(code: RegistrationErrorCode) {
    super(registrationErrorMessages[code]);
    this.code = code;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createAccountId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `account-${Date.now()}`;
}

export function validateRegistrationInput(input: RegistrationInput): RegistrationErrorCode | null {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) {
    return 'INVALID_EMAIL';
  }

  if (input.password.length < 8) {
    return 'SHORT_PASSWORD';
  }

  if (!input.privacyNoticeAccepted) {
    return 'PRIVACY_NOTICE_REQUIRED';
  }

  return null;
}

export async function registerLocalAccount(
  input: RegistrationInput,
  repository: AccountRepository,
  passwordHasher: PasswordHasher,
): Promise<AccountRecord> {
  const validationError = validateRegistrationInput(input);

  if (validationError) {
    throw new RegistrationError(validationError);
  }

  const email = normalizeEmail(input.email);
  const existingAccount = await repository.findByEmail(email);

  if (existingAccount) {
    throw new RegistrationError('DUPLICATE_EMAIL');
  }

  try {
    const now = new Date().toISOString();
    const account: AccountRecord = {
      id: createAccountId(),
      email,
      passwordHash: await passwordHasher(input.password),
      privacyNoticeAcceptedAt: now,
      createdAt: now,
    };

    await repository.create(account);

    return account;
  } catch (error) {
    if (error instanceof RegistrationError) {
      throw error;
    }

    throw new RegistrationError('REGISTRATION_UNAVAILABLE');
  }
}
