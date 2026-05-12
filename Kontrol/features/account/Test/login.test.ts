import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearActiveLocalSession,
  getActiveLocalSession,
  loginLocalAccount,
  LoginError,
} from '../login.ts';
import type { LoginRepository } from '../login.ts';
import type { AccountRecord, SessionRecord } from '../registration.ts';

function createMemoryRepository(
  initialAccounts: AccountRecord[] = [],
  initialSession: SessionRecord | null = null,
): LoginRepository {
  const accounts = [...initialAccounts];
  let activeSession = initialSession;

  return {
    async findByEmail(email) {
      return accounts.find((account) => account.email === email) ?? null;
    },
    async create(account) {
      accounts.push(account);
    },
    async saveSession(session) {
      activeSession = session;
    },
    async getActiveSession() {
      return activeSession;
    },
    async clearSession() {
      activeSession = null;
    },
  };
}

function createAccount(): AccountRecord {
  return {
    id: 'account-1',
    email: 'usuario@correo.com',
    passwordHash: 'test-hash:Kontrol123@',
    privacyNoticeAcceptedAt: '2026-05-11T00:00:00.000Z',
    createdAt: '2026-05-11T00:00:00.000Z',
  };
}

async function testPasswordVerifier(password: string, passwordHash: string): Promise<boolean> {
  return passwordHash === `test-hash:${password}`;
}

test('CP-02 happy path authenticates valid local credentials and stores a session', async () => {
  const repository = createMemoryRepository([createAccount()]);

  const session = await loginLocalAccount(
    { email: ' Usuario@Correo.com ', password: 'Kontrol123@' },
    repository,
    testPasswordVerifier,
  );

  assert.equal(session.accountId, 'account-1');
  assert.equal(session.email, 'usuario@correo.com');
  assert.deepEqual(await repository.getActiveSession(), session);
});

test('CP-02 alternate path allows correction after invalid credentials', async () => {
  const repository = createMemoryRepository([createAccount()]);

  await assert.rejects(
    loginLocalAccount(
      { email: 'usuario@correo.com', password: 'Incorrecta123' },
      repository,
      testPasswordVerifier,
    ),
    (error) => error instanceof LoginError && error.code === 'INVALID_CREDENTIALS',
  );

  const session = await loginLocalAccount(
    { email: 'usuario@correo.com', password: 'Kontrol123@' },
    repository,
    testPasswordVerifier,
  );

  assert.equal(session.email, 'usuario@correo.com');
});

test('CP-02 failure path rejects invalid credentials without storing a session', async () => {
  const repository = createMemoryRepository([createAccount()]);

  await assert.rejects(
    loginLocalAccount(
      { email: 'usuario@correo.com', password: 'Incorrecta123' },
      repository,
      testPasswordVerifier,
    ),
    (error) => error instanceof LoginError && error.code === 'INVALID_CREDENTIALS',
  );

  assert.equal(await repository.getActiveSession(), null);
});

test('CP-02 session path returns an already active local session', async () => {
  const existingSession = {
    accountId: 'account-1',
    email: 'usuario@correo.com',
    createdAt: '2026-05-11T00:00:00.000Z',
  };
  const repository = createMemoryRepository([createAccount()], existingSession);

  assert.deepEqual(await getActiveLocalSession(repository), existingSession);
});

test('CP-02 logout path clears the active local session', async () => {
  const existingSession = {
    accountId: 'account-1',
    email: 'usuario@correo.com',
    createdAt: '2026-05-11T00:00:00.000Z',
  };
  const repository = createMemoryRepository([createAccount()], existingSession);

  await clearActiveLocalSession(repository);

  assert.equal(await getActiveLocalSession(repository), null);
});
