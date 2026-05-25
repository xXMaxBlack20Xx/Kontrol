import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildHabitDetailSummary,
  buildProgressSummary,
  calculateCurrentStreak,
  completeHabitForToday,
  summarizeCompletionsForToday,
} from './completion.ts';
import type { HabitCompletionRecord, HabitCompletionRepository } from './completion.ts';
import type { HabitRecord } from './habit.ts';

function createMemoryCompletionRepository(
  initialCompletions: HabitCompletionRecord[] = [],
): HabitCompletionRepository & { count(): number } {
  const completions = [...initialCompletions];

  return {
    async create(completion) {
      if (
        completions.some(
          (storedCompletion) =>
            storedCompletion.habitId === completion.habitId &&
            storedCompletion.completedOn === completion.completedOn,
        )
      ) {
        return;
      }

      completions.push(completion);
    },
    async findByHabitDate(habitId, completedOn) {
      return (
        completions.find(
          (completion) => completion.habitId === habitId && completion.completedOn === completedOn,
        ) ?? null
      );
    },
    async listByAccount(accountId) {
      return completions.filter((completion) => completion.accountId === accountId);
    },
    async listByHabit(habitId) {
      return completions.filter((completion) => completion.habitId === habitId);
    },
    count() {
      return completions.length;
    },
  };
}

function createExistingHabit(id = 'habit-1'): HabitRecord {
  return {
    id,
    accountId: 'account-1',
    name: 'Leer',
    frequency: 'daily',
    createdAt: '2026-05-11T00:00:00.000Z',
  };
}

function createCompletion(completedOn: string, habitId = 'habit-1'): HabitCompletionRecord {
  return {
    id: `completion-${habitId}-${completedOn}`,
    accountId: 'account-1',
    habitId,
    completedOn,
    completedAt: `${completedOn}T12:00:00.000Z`,
  };
}

test('CP-07 happy path marks a visible habit as completed for today', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryCompletionRepository();
  const today = new Date(2026, 4, 11, 12);

  const result = await completeHabitForToday(habit, repository, today);

  assert.equal(result.didCreate, true);
  assert.equal(result.completion.habitId, habit.id);
  assert.equal(result.completion.accountId, habit.accountId);
  assert.equal(result.completion.completedOn, '2026-05-11');
  assert.equal(result.currentStreak, 1);
  assert.equal(repository.count(), 1);
});

test('CP-07 alternate path summarizes a previously completed habit as completed today', () => {
  const summary = summarizeCompletionsForToday([createCompletion('2026-05-11')], new Date(2026, 4, 11, 12));

  assert.equal(summary['habit-1'].completedToday, true);
  assert.equal(summary['habit-1'].currentStreak, 1);
});

test('CP-07 failure path preserves one valid completion for the same habit and date', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryCompletionRepository();
  const today = new Date(2026, 4, 11, 12);

  await completeHabitForToday(habit, repository, today);
  const secondResult = await completeHabitForToday(habit, repository, today);

  assert.equal(secondResult.didCreate, false);
  assert.equal(secondResult.currentStreak, 1);
  assert.equal(repository.count(), 1);
});

test('CP-07 failure path blocks completion outside scheduled days before writing', async () => {
  const habit = createExistingHabit();
  const repository = createMemoryCompletionRepository();
  const mondayWednesdayFridayHabit: HabitRecord = {
    ...habit,
    frequency: 'custom',
    daysOfWeek: [1, 3, 5],
  };

  await assert.rejects(
    completeHabitForToday(mondayWednesdayFridayHabit, repository, new Date(2026, 4, 12, 12)),
    { code: 'HABIT_NOT_SCHEDULED_TODAY' },
  );
  assert.equal(repository.count(), 0);
});

test('CP-07 recalculates the current streak from consecutive completion dates', () => {
  const streak = calculateCurrentStreak(
    [createCompletion('2026-05-09'), createCompletion('2026-05-10'), createCompletion('2026-05-11')],
    '2026-05-11',
  );

  assert.equal(streak, 3);
});

test('CP-08 happy path builds habit detail with today state, streak, and history', () => {
  const habit = createExistingHabit();
  const detail = buildHabitDetailSummary(
    habit,
    [createCompletion('2026-05-09'), createCompletion('2026-05-10'), createCompletion('2026-05-11')],
    new Date(2026, 4, 11, 12),
  );

  assert.equal(detail?.habit.name, 'Leer');
  assert.equal(detail?.habit.frequency, 'daily');
  assert.equal(detail?.completedToday, true);
  assert.equal(detail?.currentStreak, 3);
  assert.deepEqual(detail?.historyDates, ['2026-05-10', '2026-05-09']);
  assert.equal(detail?.hasEnoughHistory, true);
});

test('CP-08 alternate path shows basic detail when there is not enough history', () => {
  const habit = createExistingHabit();
  const detail = buildHabitDetailSummary(habit, [createCompletion('2026-05-11')], new Date(2026, 4, 11, 12));

  assert.equal(detail?.habit.name, 'Leer');
  assert.equal(detail?.completedToday, true);
  assert.equal(detail?.currentStreak, 1);
  assert.deepEqual(detail?.historyDates, []);
  assert.equal(detail?.hasEnoughHistory, false);
});

test('CP-08 failure path returns no detail for an unavailable habit', () => {
  const detail = buildHabitDetailSummary(null, [createCompletion('2026-05-11')], new Date(2026, 4, 11, 12));

  assert.equal(detail, null);
});

test('CP-09 happy path builds weekly progress indicators from local completions', () => {
  const summary = buildProgressSummary(
    [createExistingHabit('habit-1'), createExistingHabit('habit-2')],
    [
      createCompletion('2026-05-10', 'habit-1'),
      createCompletion('2026-05-11', 'habit-1'),
      createCompletion('2026-05-11', 'habit-2'),
    ],
    'weekly',
    new Date(2026, 4, 11, 12),
  );

  assert.equal(summary.period, 'weekly');
  assert.equal(summary.totalHabits, 2);
  assert.equal(summary.totalCompletions, 3);
  assert.equal(summary.activeHabitCount, 2);
  assert.equal(summary.hasEnoughData, true);
  assert.equal(summary.points.length, 7);
  assert.equal(summary.points.at(-1)?.date, '2026-05-11');
  assert.equal(summary.points.at(-1)?.completionRate, 100);
});

test('CP-09 alternate path changes period without altering stored completion data', () => {
  const habits = [createExistingHabit('habit-1')];
  const completions = [createCompletion('2026-04-20'), createCompletion('2026-05-11')];

  const weeklySummary = buildProgressSummary(habits, completions, 'weekly', new Date(2026, 4, 11, 12));
  const monthlySummary = buildProgressSummary(habits, completions, 'monthly', new Date(2026, 4, 11, 12));

  assert.equal(weeklySummary.period, 'weekly');
  assert.equal(monthlySummary.period, 'monthly');
  assert.equal(weeklySummary.totalCompletions, 1);
  assert.equal(monthlySummary.totalCompletions, 2);
  assert.deepEqual(completions, [createCompletion('2026-04-20'), createCompletion('2026-05-11')]);
});

test('CP-09 failure path returns contextual empty progress when data is insufficient', () => {
  const summary = buildProgressSummary(
    [createExistingHabit('habit-1')],
    [],
    'weekly',
    new Date(2026, 4, 11, 12),
  );

  assert.equal(summary.hasEnoughData, false);
  assert.equal(summary.totalCompletions, 0);
  assert.equal(summary.completionRate, 0);
});
