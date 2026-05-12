import assert from 'node:assert/strict';
import test from 'node:test';

import type { AccountRecord, AccountRepository } from '../registration.ts';
import { registerLocalAccount, RegistrationError } from '../registration.ts';

function createMemoryRepository(initialAccounts: AccountRecord[] = []): AccountRepository {
  const accounts = [...initialAccounts];

  return {
    async findByEmail(email) {
      return accounts.find((account) => account.email === email) ?? null;
    },
    async create(account) {
      accounts.push(account);
    },
  };
}

async function testPasswordHasher(password: string): Promise<string> {
  return `test-hash:${password.length}`;
}

test('CP-01 happy path creates a local account with normalized email and hashed password', async () => {
  const repository = createMemoryRepository();

  const account = await registerLocalAccount(
    {
      email: ' Usuario@Correo.com ',
      password: 'Kontrol123',
      privacyNoticeAccepted: true,
    },
    repository,
    testPasswordHasher,
  );

  assert.equal(account.email, 'usuario@correo.com');
  assert.notEqual(account.passwordHash, 'Kontrol123');
  assert.ok(account.privacyNoticeAcceptedAt);
  assert.deepEqual(await repository.findByEmail('usuario@correo.com'), account);
});

test('CP-01 alternate path succeeds after the user corrects invalid data', async () => {
  const repository = createMemoryRepository();

  await assert.rejects(
    registerLocalAccount(
      {
        email: 'usuariocorreo.com',
        password: 'Kontrol123',
        privacyNoticeAccepted: true,
      },
      repository,
      testPasswordHasher,
    ),
    (error) => error instanceof RegistrationError && error.code === 'INVALID_EMAIL',
  );

  const account = await registerLocalAccount(
    {
      email: 'usuario@correo.com',
      password: 'Kontrol123',
      privacyNoticeAccepted: true,
    },
    repository,
    testPasswordHasher,
  );

  assert.equal(account.email, 'usuario@correo.com');
});

test('CP-01 failure path rejects invalid or duplicate registration data', async () => {
  const repository = createMemoryRepository([
    {
      id: 'existing-account',
      email: 'usuario@correo.com',
      passwordHash: 'test-hash:10',
      privacyNoticeAcceptedAt: '2026-05-11T00:00:00.000Z',
      createdAt: '2026-05-11T00:00:00.000Z',
    },
  ]);

  await assert.rejects(
    registerLocalAccount(
      { email: 'usuariocorreo.com', password: 'Kontrol123', privacyNoticeAccepted: true },
      repository,
      testPasswordHasher,
    ),
    (error) => error instanceof RegistrationError && error.code === 'INVALID_EMAIL',
  );

  await assert.rejects(
    registerLocalAccount(
      { email: 'nuevo@correo.com', password: '1234567', privacyNoticeAccepted: true },
      repository,
      testPasswordHasher,
    ),
    (error) => error instanceof RegistrationError && error.code === 'SHORT_PASSWORD',
  );

  await assert.rejects(
    registerLocalAccount(
      { email: 'nuevo@correo.com', password: 'Kontrol123', privacyNoticeAccepted: false },
      repository,
      testPasswordHasher,
    ),
    (error) => error instanceof RegistrationError && error.code === 'PRIVACY_NOTICE_REQUIRED',
  );

  await assert.rejects(
    registerLocalAccount(
      { email: 'usuario@correo.com', password: 'Kontrol123', privacyNoticeAccepted: true },
      repository,
      testPasswordHasher,
    ),
    (error) => error instanceof RegistrationError && error.code === 'DUPLICATE_EMAIL',
  );
});
