import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHabit,
  CreateHabitError,
  deleteHabit,
  DeleteHabitError,
  editHabit,
  EditHabitError,
} from './habit.ts';
import type { HabitRecord, HabitRepository } from './habit.ts';

function createMemoryRepository(initialHabits: HabitRecord[] = []): HabitRepository {
  const habits = [...initialHabits];

  return {
    async create(habit) {
      habits.push(habit);
    },
    async update(habit) {
      const habitIndex = habits.findIndex((storedHabit) => storedHabit.id === habit.id);

      if (habitIndex >= 0) {
        habits[habitIndex] = habit;
      }
    },
    async remove(habitId) {
      const habitIndex = habits.findIndex((storedHabit) => storedHabit.id === habitId);

      if (habitIndex < 0) {
        return false;
      }

      habits.splice(habitIndex, 1);

      return true;
    },
    async listByAccount(accountId) {
      return habits.filter((habit) => habit.accountId === accountId);
    },
  };
}

function createExistingHabit(): HabitRecord {
  return {
    id: 'habit-1',
    accountId: 'account-1',
    name: 'Leer',
    frequency: 'daily',
    category: 'estudio',
    target: 'leer 10 paginas',
    reminderTime: '08:00',
    createdAt: '2026-05-11T00:00:00.000Z',
  };
}

test('CP-04 happy path creates a habit with required data and lists it', async () => {
  const repository = createMemoryRepository();

  const habit = await createHabit(
    {
      accountId: 'account-1',
      name: 'Leer',
      frequency: 'daily',
      daysOfWeek: [1, 3, 5],
    },
    repository,
  );

  assert.equal(habit.name, 'Leer');
  assert.equal(habit.frequency, 'daily');
  assert.deepEqual(habit.daysOfWeek, [1, 3, 5]);
  assert.deepEqual(await repository.listByAccount('account-1'), [habit]);
});

test('CP-04 alternate path stores optional habit information', async () => {
  const repository = createMemoryRepository();

  const habit = await createHabit(
    {
      accountId: 'account-1',
      name: 'Leer',
      frequency: 'daily',
      category: 'estudio',
      color: '#007AFF',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      icon: 'menu-book',
      subcategories: ['Lectura', 'Enfoque'],
      target: 'leer 10 paginas',
      reminderTime: '08:00',
    },
    repository,
  );

  assert.equal(habit.category, 'estudio');
  assert.equal(habit.color, '#007AFF');
  assert.deepEqual(habit.daysOfWeek, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(habit.icon, 'menu-book');
  assert.deepEqual(habit.subcategories, ['Lectura', 'Enfoque']);
  assert.equal(habit.target, 'leer 10 paginas');
  assert.equal(habit.reminderTime, '08:00');
});

test('CP-04 failure path rejects missing required habit fields', async () => {
  const repository = createMemoryRepository();

  await assert.rejects(
    createHabit(
      {
        accountId: 'account-1',
        name: '',
        frequency: 'daily',
      },
      repository,
    ),
    (error) => error instanceof CreateHabitError && error.code === 'NAME_REQUIRED',
  );

  await assert.rejects(
    createHabit(
      {
        accountId: 'account-1',
        name: 'A',
        frequency: 'daily',
      },
      repository,
    ),
    (error) => error instanceof CreateHabitError && error.code === 'NAME_TOO_SHORT',
  );

  await assert.rejects(
    createHabit(
      {
        accountId: 'account-1',
        name: 'A'.repeat(61),
        frequency: 'daily',
      },
      repository,
    ),
    (error) => error instanceof CreateHabitError && error.code === 'NAME_TOO_LONG',
  );

  await assert.rejects(
    createHabit(
      {
        accountId: 'account-1',
        name: 'Leer',
        frequency: '',
      },
      repository,
    ),
    (error) => error instanceof CreateHabitError && error.code === 'FREQUENCY_REQUIRED',
  );

  await assert.rejects(
    createHabit(
      {
        accountId: 'account-1',
        name: 'Leer',
        frequency: 'daily',
        daysOfWeek: [],
      },
      repository,
    ),
    (error) => error instanceof CreateHabitError && error.code === 'DAYS_OF_WEEK_REQUIRED',
  );

  assert.deepEqual(await repository.listByAccount('account-1'), []);
});

test('CP-05 happy path edits an existing habit with valid data', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository([habit]);

  const updatedHabit = await editHabit(
    habit,
    { name: 'Leer 30 minutos', frequency: 'daily' },
    repository,
  );

  assert.equal(updatedHabit.id, habit.id);
  assert.equal(updatedHabit.accountId, habit.accountId);
  assert.equal(updatedHabit.createdAt, habit.createdAt);
  assert.equal(updatedHabit.name, 'Leer 30 minutos');
  assert.deepEqual(await repository.listByAccount('account-1'), [updatedHabit]);
});

test('CP-05 alternate path edits one field and preserves the rest', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository([habit]);

  const updatedHabit = await editHabit(habit, { category: 'personal' }, repository);

  assert.equal(updatedHabit.category, 'personal');
  assert.equal(updatedHabit.name, habit.name);
  assert.equal(updatedHabit.frequency, habit.frequency);
  assert.equal(updatedHabit.target, habit.target);
  assert.equal(updatedHabit.reminderTime, habit.reminderTime);
});

test('CP-05 failure path rejects invalid edits without changing the habit', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository([habit]);

  await assert.rejects(
    editHabit(habit, { name: '' }, repository),
    (error) => error instanceof EditHabitError && error.code === 'NAME_REQUIRED',
  );

  await assert.rejects(
    editHabit(habit, { frequency: '' }, repository),
    (error) => error instanceof EditHabitError && error.code === 'FREQUENCY_REQUIRED',
  );

  assert.deepEqual(await repository.listByAccount('account-1'), [habit]);
});

test('CP-06 happy path deletes an existing habit after explicit confirmation', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository([habit]);

  const deletedHabit = await deleteHabit(habit, true, repository);

  assert.equal(deletedHabit.id, habit.id);
  assert.deepEqual(await repository.listByAccount('account-1'), []);
});

test('CP-06 alternate path cancels deletion and preserves the habit', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository([habit]);

  await assert.rejects(
    deleteHabit(habit, false, repository),
    (error) => error instanceof DeleteHabitError && error.code === 'CONFIRMATION_REQUIRED',
  );

  assert.deepEqual(await repository.listByAccount('account-1'), [habit]);
});

test('CP-06 failure path rejects deletion when the habit cannot be found', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryRepository();

  await assert.rejects(
    deleteHabit(habit, true, repository),
    (error) => error instanceof DeleteHabitError && error.code === 'HABIT_NOT_FOUND',
  );

  assert.deepEqual(await repository.listByAccount('account-1'), []);
});
