import assert from 'node:assert/strict';
import test from 'node:test';

import type { HabitCompletionRecord } from './completion.ts';
import type { HabitRecord } from './habit.ts';
import {
  calculateBestStreak,
  calculateCurrentStreak,
  calculateTodaySummary,
  calculateProgressDashboard,
  calculateTodayProgress,
  calculateWeeklySeries,
  getTodayKey,
  getWeekRange,
  isHabitScheduledForDate,
  normalizeDateToLocalKey,
} from './progress-helpers.ts';

function createHabit(overrides: Partial<HabitRecord> = {}): HabitRecord {
  return {
    id: 'habit-1',
    accountId: 'account-1',
    name: 'Leer',
    frequency: 'daily',
    createdAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
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

test('CP-09 returns empty progress metrics when there are no habits', () => {
  const progress = calculateProgressDashboard([], [], new Date(2026, 4, 11, 12));

  assert.equal(progress.hasHabits, false);
  assert.equal(progress.currentStreak, 0);
  assert.equal(progress.bestStreak, 0);
  assert.equal(progress.todayExpected, 0);
  assert.equal(progress.todayCompletionRate, 0);
});

test('CP-09 returns zero streak for daily habits without completions', () => {
  const habit = createHabit();
  const progress = calculateProgressDashboard([habit], [], new Date(2026, 4, 11, 12));

  assert.equal(progress.hasHabits, true);
  assert.equal(progress.hasCompletions, false);
  assert.equal(progress.currentStreak, 0);
  assert.equal(progress.todayExpected, 1);
  assert.equal(progress.todayCompleted, 0);
});

test('CP-09 calculates a 3-day current streak from consecutive valid days', () => {
  const habit = createHabit();
  const streak = calculateCurrentStreak(
    [habit],
    [createCompletion('2026-05-09'), createCompletion('2026-05-10'), createCompletion('2026-05-11')],
    new Date(2026, 4, 11, 12),
  );

  assert.equal(streak, 3);
});

test('CP-09 non-scheduled days do not break the current streak', () => {
  const habit = createHabit({ frequency: 'custom', daysOfWeek: [1, 3, 5] });
  const streak = calculateCurrentStreak(
    [habit],
    [createCompletion('2026-05-15')],
    new Date(2026, 4, 17, 12),
  );

  assert.equal(streak, 1);
  assert.equal(isHabitScheduledForDate(habit, '2026-05-17'), false);
});

test('CP-09 respects Monday Wednesday Friday custom schedules', () => {
  const habit = createHabit({ frequency: 'custom', daysOfWeek: [1, 3, 5] });
  const completions = [
    createCompletion('2026-05-11'),
    createCompletion('2026-05-13'),
    createCompletion('2026-05-15'),
  ];

  assert.equal(isHabitScheduledForDate(habit, '2026-05-12'), false);
  assert.equal(calculateCurrentStreak([habit], completions, new Date(2026, 4, 15, 12)), 3);
  assert.equal(calculateBestStreak([habit], completions, new Date(2026, 4, 15, 12)), 3);
});

test('CP-07 duplicate completions for the same habit and date count once', () => {
  const habit = createHabit();
  const todayProgress = calculateTodayProgress(
    [habit],
    [createCompletion('2026-05-11'), createCompletion('2026-05-11')],
    new Date(2026, 4, 11, 12),
  );
  const dashboard = calculateProgressDashboard(
    [habit],
    [createCompletion('2026-05-11'), createCompletion('2026-05-11')],
    new Date(2026, 4, 11, 12),
  );

  assert.equal(todayProgress.todayCompleted, 1);
  assert.equal(todayProgress.todayCompletionRate, 100);
  assert.equal(dashboard.totalCompletions, 1);
});

test('CP-07/CP-09 today summary counts only habits scheduled today and active completions', () => {
  const mondayHabit = createHabit({ id: 'habit-monday', frequency: 'custom', daysOfWeek: [1] });
  const tuesdayHabit = createHabit({ id: 'habit-tuesday', frequency: 'custom', daysOfWeek: [2] });
  const summary = calculateTodaySummary(
    [mondayHabit, tuesdayHabit],
    [createCompletion('2026-05-11', 'habit-monday'), createCompletion('2026-05-11', 'deleted-habit')],
    new Date(2026, 4, 11, 12),
  );

  assert.equal(summary.activeHabitCount, 2);
  assert.equal(summary.todayHabitCount, 1);
  assert.equal(summary.completedTodayCount, 1);
  assert.equal(summary.pendingTodayCount, 0);
  assert.equal(summary.completionRate, 100);
  assert.equal(summary.totalCompletions, 1);
});

test('CP-09 uses local YYYY-MM-DD keys for date normalization', () => {
  assert.equal(normalizeDateToLocalKey(new Date(2026, 4, 11, 23, 30)), '2026-05-11');
  assert.equal(normalizeDateToLocalKey('2026-05-11T01:30:00.000Z'), '2026-05-11');
  assert.equal(getTodayKey(new Date(2026, 4, 11, 12)), '2026-05-11');
});

test('CP-09 builds a Monday-to-Sunday weekly series', () => {
  const habit = createHabit();
  const weekRange = getWeekRange(new Date(2026, 4, 13, 12));
  const series = calculateWeeklySeries(
    [habit],
    [createCompletion('2026-05-11'), createCompletion('2026-05-13')],
    new Date(2026, 4, 13, 12),
  );

  assert.deepEqual(weekRange.dates, [
    '2026-05-11',
    '2026-05-12',
    '2026-05-13',
    '2026-05-14',
    '2026-05-15',
    '2026-05-16',
    '2026-05-17',
  ]);
  assert.equal(series[0].dayLabel, 'Lun');
  assert.equal(series[2].completed, 1);
  assert.equal(series[2].rate, 100);
  assert.equal(series[6].isFuture, true);
});
