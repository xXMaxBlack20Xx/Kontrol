import type { HabitCompletionRecord } from './completion';
import type { HabitRecord } from './habit';

export type ProgressHabitStat = {
  habitId: string;
  name: string;
  completedToday: boolean;
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  completedCount: number;
  expectedCount: number;
  color?: string;
  coverPhotoUrl?: string;
  daysOfWeek?: number[];
};

export type WeeklyProgressPoint = {
  date: string;
  dayLabel: string;
  completed: number;
  expected: number;
  rate: number;
  isToday: boolean;
  isFuture: boolean;
};

export type TodayProgress = {
  todayCompleted: number;
  todayExpected: number;
  todayCompletionRate: number;
};

export type ProgressDashboard = TodayProgress & {
  currentStreak: number;
  bestStreak: number;
  weekCompleted: number;
  weekExpected: number;
  weekCompletionRate: number;
  monthCompleted: number;
  monthExpected: number;
  monthCompletionRate: number;
  activeHabits: number;
  totalCompletions: number;
  hasHabits: boolean;
  hasCompletions: boolean;
  habitStats: ProgressHabitStat[];
  weeklySeries: WeeklyProgressPoint[];
};

const shortDayLabels: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

export function normalizeDateToLocalKey(date: Date | string): string {
  if (typeof date === 'string') {
    const dateOnly = date.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

    if (dateOnly) {
      return dateOnly;
    }
  }

  const localDate = typeof date === 'string' ? new Date(date) : date;
  const year = localDate.getFullYear();
  const month = `${localDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${localDate.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTodayKey(today = new Date()): string {
  return normalizeDateToLocalKey(today);
}

function createLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day, 12);
}

function addDays(dateKey: string, days: number): string {
  const date = createLocalDate(dateKey);
  date.setDate(date.getDate() + days);

  return normalizeDateToLocalKey(date);
}

function compareDateKeys(firstDateKey: string, secondDateKey: string): number {
  return firstDateKey.localeCompare(secondDateKey);
}

function getHabitStartKey(habit: HabitRecord): string {
  return normalizeDateToLocalKey(habit.createdAt);
}

function getEarliestHabitStartKey(habits: HabitRecord[]): string | null {
  return habits.reduce<string | null>((earliestDateKey, habit) => {
    const habitStartKey = getHabitStartKey(habit);

    if (!earliestDateKey || compareDateKeys(habitStartKey, earliestDateKey) < 0) {
      return habitStartKey;
    }

    return earliestDateKey;
  }, null);
}

function getDateKeysBetween(startDateKey: string, endDateKey: string): string[] {
  const dates: string[] = [];
  let currentDateKey = startDateKey;

  while (compareDateKeys(currentDateKey, endDateKey) <= 0) {
    dates.push(currentDateKey);
    currentDateKey = addDays(currentDateKey, 1);
  }

  return dates;
}

export function getWeekRange(today = new Date()): { start: string; end: string; dates: string[] } {
  const todayKey = getTodayKey(today);
  const currentDate = createLocalDate(todayKey);
  const mondayOffset = (currentDate.getDay() + 6) % 7;
  const start = addDays(todayKey, -mondayOffset);
  const end = addDays(start, 6);

  return {
    start,
    end,
    dates: getDateKeysBetween(start, end),
  };
}

function getMonthRange(today = new Date()): { start: string; end: string; dates: string[] } {
  const todayKey = getTodayKey(today);
  const todayDate = createLocalDate(todayKey);
  const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 12);
  const start = normalizeDateToLocalKey(monthStart);

  return {
    start,
    end: todayKey,
    dates: getDateKeysBetween(start, todayKey),
  };
}

export function isHabitScheduledForDate(habit: HabitRecord, date: Date | string): boolean {
  const dateKey = normalizeDateToLocalKey(date);

  if (compareDateKeys(dateKey, getHabitStartKey(habit)) < 0) {
    return false;
  }

  if (habit.frequency === 'daily' || !habit.daysOfWeek?.length) {
    return true;
  }

  // El contrato actual usa 0 = domingo, 1 = lunes, ..., 6 = sábado.
  return habit.daysOfWeek.includes(createLocalDate(dateKey).getDay());
}

function buildCompletionIndex(completions: HabitCompletionRecord[]): Map<string, Set<string>> {
  return completions.reduce<Map<string, Set<string>>>((index, completion) => {
    const dateKey = normalizeDateToLocalKey(completion.completedOn);
    const habitIds = index.get(dateKey) ?? new Set<string>();
    habitIds.add(completion.habitId);
    index.set(dateKey, habitIds);

    return index;
  }, new Map());
}

function countExpectedHabitsForDate(habits: HabitRecord[], dateKey: string): number {
  return habits.filter((habit) => isHabitScheduledForDate(habit, dateKey)).length;
}

function countCompletedHabitsForDate(
  habits: HabitRecord[],
  completionIndex: Map<string, Set<string>>,
  dateKey: string,
): number {
  const scheduledHabitIds = new Set(
    habits.filter((habit) => isHabitScheduledForDate(habit, dateKey)).map((habit) => habit.id),
  );
  const completedHabitIds = completionIndex.get(dateKey) ?? new Set<string>();
  let completedCount = 0;

  completedHabitIds.forEach((habitId) => {
    if (scheduledHabitIds.has(habitId)) {
      completedCount += 1;
    }
  });

  return completedCount;
}

function rate(completed: number, expected: number): number {
  return expected > 0 ? Math.round((completed / expected) * 100) : 0;
}

function didCompleteScheduledHabitOnDate(
  habits: HabitRecord[],
  completionIndex: Map<string, Set<string>>,
  dateKey: string,
): boolean {
  return countExpectedHabitsForDate(habits, dateKey) > 0 && countCompletedHabitsForDate(habits, completionIndex, dateKey) > 0;
}

export function calculateCurrentStreak(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): number {
  const earliestHabitStartKey = getEarliestHabitStartKey(habits);

  if (!earliestHabitStartKey) {
    return 0;
  }

  const completionIndex = buildCompletionIndex(completions);
  let currentDateKey = getTodayKey(today);
  let streak = 0;

  while (compareDateKeys(currentDateKey, earliestHabitStartKey) >= 0) {
    const expectedCount = countExpectedHabitsForDate(habits, currentDateKey);

    if (expectedCount === 0) {
      currentDateKey = addDays(currentDateKey, -1);
      continue;
    }

    if (!didCompleteScheduledHabitOnDate(habits, completionIndex, currentDateKey)) {
      break;
    }

    streak += 1;
    currentDateKey = addDays(currentDateKey, -1);
  }

  return streak;
}

export function calculateBestStreak(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): number {
  const earliestHabitStartKey = getEarliestHabitStartKey(habits);

  if (!earliestHabitStartKey) {
    return 0;
  }

  const completionIndex = buildCompletionIndex(completions);
  let currentStreak = 0;
  let bestStreak = 0;

  getDateKeysBetween(earliestHabitStartKey, getTodayKey(today)).forEach((dateKey) => {
    const expectedCount = countExpectedHabitsForDate(habits, dateKey);

    if (expectedCount === 0) {
      return;
    }

    if (didCompleteScheduledHabitOnDate(habits, completionIndex, dateKey)) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return bestStreak;
}

export function calculateTodayProgress(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): TodayProgress {
  const todayKey = getTodayKey(today);
  const completionIndex = buildCompletionIndex(completions);
  const todayExpected = countExpectedHabitsForDate(habits, todayKey);
  const todayCompleted = countCompletedHabitsForDate(habits, completionIndex, todayKey);

  return {
    todayCompleted,
    todayExpected,
    todayCompletionRate: rate(todayCompleted, todayExpected),
  };
}

export function calculateWeeklySeries(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): WeeklyProgressPoint[] {
  const todayKey = getTodayKey(today);
  const completionIndex = buildCompletionIndex(completions);

  return getWeekRange(today).dates.map((dateKey) => {
    const completed = countCompletedHabitsForDate(habits, completionIndex, dateKey);
    const expected = countExpectedHabitsForDate(habits, dateKey);
    const day = createLocalDate(dateKey).getDay();

    return {
      date: dateKey,
      dayLabel: shortDayLabels[day],
      completed,
      expected,
      rate: rate(completed, expected),
      isToday: dateKey === todayKey,
      isFuture: compareDateKeys(dateKey, todayKey) > 0,
    };
  });
}

function calculateRangeTotals(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  dates: string[],
): { completed: number; expected: number; completionRate: number } {
  const completionIndex = buildCompletionIndex(completions);
  const totals = dates.reduce(
    (currentTotals, dateKey) => {
      return {
        completed: currentTotals.completed + countCompletedHabitsForDate(habits, completionIndex, dateKey),
        expected: currentTotals.expected + countExpectedHabitsForDate(habits, dateKey),
      };
    },
    { completed: 0, expected: 0 },
  );

  return {
    ...totals,
    completionRate: rate(totals.completed, totals.expected),
  };
}

function calculateHabitCurrentStreak(
  habit: HabitRecord,
  completions: HabitCompletionRecord[],
  today = new Date(),
): number {
  const completionDates = new Set(
    completions.filter((completion) => completion.habitId === habit.id).map((completion) => normalizeDateToLocalKey(completion.completedOn)),
  );
  const habitStartKey = getHabitStartKey(habit);
  let currentDateKey = getTodayKey(today);
  let streak = 0;

  while (compareDateKeys(currentDateKey, habitStartKey) >= 0) {
    if (!isHabitScheduledForDate(habit, currentDateKey)) {
      currentDateKey = addDays(currentDateKey, -1);
      continue;
    }

    if (!completionDates.has(currentDateKey)) {
      break;
    }

    streak += 1;
    currentDateKey = addDays(currentDateKey, -1);
  }

  return streak;
}

function calculateHabitBestStreak(
  habit: HabitRecord,
  completions: HabitCompletionRecord[],
  today = new Date(),
): number {
  const completionDates = new Set(
    completions.filter((completion) => completion.habitId === habit.id).map((completion) => normalizeDateToLocalKey(completion.completedOn)),
  );
  let currentStreak = 0;
  let bestStreak = 0;

  getDateKeysBetween(getHabitStartKey(habit), getTodayKey(today)).forEach((dateKey) => {
    if (!isHabitScheduledForDate(habit, dateKey)) {
      return;
    }

    if (completionDates.has(dateKey)) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return bestStreak;
}

function buildHabitStats(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): ProgressHabitStat[] {
  const todayKey = getTodayKey(today);
  const monthDates = getMonthRange(today).dates;
  const completionIndex = buildCompletionIndex(completions);

  return habits.map((habit) => {
    const expectedDates = monthDates.filter((dateKey) => isHabitScheduledForDate(habit, dateKey));
    const habitCompletionDates = new Set(
      completions.filter((completion) => completion.habitId === habit.id).map((completion) => normalizeDateToLocalKey(completion.completedOn)),
    );
    const completedCount = expectedDates.filter((dateKey) => habitCompletionDates.has(dateKey)).length;
    const completedToday = Boolean(completionIndex.get(todayKey)?.has(habit.id));

    return {
      habitId: habit.id,
      name: habit.name,
      completedToday,
      currentStreak: calculateHabitCurrentStreak(habit, completions, today),
      bestStreak: calculateHabitBestStreak(habit, completions, today),
      completionRate: rate(completedCount, expectedDates.length),
      completedCount,
      expectedCount: expectedDates.length,
      color: habit.color,
      coverPhotoUrl: habit.coverPhotoUrl,
      daysOfWeek: habit.daysOfWeek,
    };
  });
}

export function calculateProgressDashboard(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  today = new Date(),
): ProgressDashboard {
  const habitIds = new Set(habits.map((habit) => habit.id));
  const scopedCompletions = completions.filter((completion) => habitIds.has(completion.habitId));
  const todayProgress = calculateTodayProgress(habits, scopedCompletions, today);
  const weekDatesThroughToday = getWeekRange(today).dates.filter(
    (dateKey) => compareDateKeys(dateKey, getTodayKey(today)) <= 0,
  );
  const weekTotals = calculateRangeTotals(habits, scopedCompletions, weekDatesThroughToday);
  const monthTotals = calculateRangeTotals(habits, scopedCompletions, getMonthRange(today).dates);
  const totalCompletionKeys = new Set(
    scopedCompletions.map((completion) => `${completion.habitId}:${normalizeDateToLocalKey(completion.completedOn)}`),
  );

  return {
    ...todayProgress,
    currentStreak: calculateCurrentStreak(habits, scopedCompletions, today),
    bestStreak: calculateBestStreak(habits, scopedCompletions, today),
    weekCompleted: weekTotals.completed,
    weekExpected: weekTotals.expected,
    weekCompletionRate: weekTotals.completionRate,
    monthCompleted: monthTotals.completed,
    monthExpected: monthTotals.expected,
    monthCompletionRate: monthTotals.completionRate,
    activeHabits: habits.length,
    totalCompletions: totalCompletionKeys.size,
    hasHabits: habits.length > 0,
    hasCompletions: totalCompletionKeys.size > 0,
    habitStats: buildHabitStats(habits, scopedCompletions, today),
    weeklySeries: calculateWeeklySeries(habits, scopedCompletions, today),
  };
}
