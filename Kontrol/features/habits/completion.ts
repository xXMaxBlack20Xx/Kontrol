import type { HabitRecord } from './habit';

export type HabitCompletionRecord = {
  id: string;
  accountId: string;
  habitId: string;
  completedOn: string;
  completedAt: string;
};

export type HabitCompletionSummary = {
  completedToday: boolean;
  currentStreak: number;
};

export type HabitDetailSummary = HabitCompletionSummary & {
  habit: HabitRecord;
  historyDates: string[];
  hasEnoughHistory: boolean;
};

export type ProgressPeriod = 'weekly' | 'monthly';

export type ProgressPoint = {
  date: string;
  completionCount: number;
  completionRate: number;
};

export type ProgressSummary = {
  period: ProgressPeriod;
  totalHabits: number;
  totalCompletions: number;
  completionRate: number;
  activeHabitCount: number;
  hasEnoughData: boolean;
  points: ProgressPoint[];
};

export type CompleteHabitResult = {
  completion: HabitCompletionRecord;
  didCreate: boolean;
  currentStreak: number;
};

export type HabitCompletionRepository = {
  create(completion: HabitCompletionRecord): Promise<void>;
  findByHabitDate(habitId: string, completedOn: string): Promise<HabitCompletionRecord | null>;
  listByAccount(accountId: string): Promise<HabitCompletionRecord[]>;
  listByHabit(habitId: string): Promise<HabitCompletionRecord[]>;
};

export type CompleteHabitErrorCode = 'HABIT_COMPLETION_UNAVAILABLE';

export const completeHabitErrorMessages: Record<CompleteHabitErrorCode, string> = {
  HABIT_COMPLETION_UNAVAILABLE: 'No se pudo registrar el cumplimiento. Intenta nuevamente.',
};

export class CompleteHabitError extends Error {
  code: CompleteHabitErrorCode;

  constructor(code: CompleteHabitErrorCode) {
    super(completeHabitErrorMessages[code]);
    this.code = code;
  }
}

function createCompletionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `completion-${Date.now()}`;
}

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return formatLocalDateKey(date);
}

export function calculateCurrentStreak(
  completions: HabitCompletionRecord[],
  currentDateKey: string,
): number {
  const completedDates = new Set(completions.map((completion) => completion.completedOn));
  let streak = 0;
  let dateToCheck = currentDateKey;

  while (completedDates.has(dateToCheck)) {
    streak += 1;
    dateToCheck = addDays(dateToCheck, -1);
  }

  return streak;
}

export function summarizeCompletionsForToday(
  completions: HabitCompletionRecord[],
  today = new Date(),
): Record<string, HabitCompletionSummary> {
  const todayKey = formatLocalDateKey(today);
  const completionsByHabit = completions.reduce<Record<string, HabitCompletionRecord[]>>(
    (currentCompletionsByHabit, completion) => {
      return {
        ...currentCompletionsByHabit,
        [completion.habitId]: [...(currentCompletionsByHabit[completion.habitId] ?? []), completion],
      };
    },
    {},
  );

  return Object.fromEntries(
    Object.entries(completionsByHabit).map(([habitId, habitCompletions]) => [
      habitId,
      {
        completedToday: habitCompletions.some((completion) => completion.completedOn === todayKey),
        currentStreak: calculateCurrentStreak(habitCompletions, todayKey),
      },
    ]),
  );
}

export function buildHabitDetailSummary(
  habit: HabitRecord | null,
  completions: HabitCompletionRecord[],
  today = new Date(),
): HabitDetailSummary | null {
  if (!habit) {
    return null;
  }

  const todayKey = formatLocalDateKey(today);
  const habitCompletions = completions.filter((completion) => completion.habitId === habit.id);
  const historyDates = Array.from(
    new Set(
      habitCompletions
        .map((completion) => completion.completedOn)
        .filter((completedOn) => completedOn < todayKey),
    ),
  ).sort((firstDate, secondDate) => secondDate.localeCompare(firstDate));

  return {
    habit,
    completedToday: habitCompletions.some((completion) => completion.completedOn === todayKey),
    currentStreak: calculateCurrentStreak(habitCompletions, todayKey),
    historyDates,
    hasEnoughHistory: historyDates.length > 0,
  };
}

function getPeriodLength(period: ProgressPeriod): number {
  return period === 'weekly' ? 7 : 30;
}

export function buildProgressSummary(
  habits: HabitRecord[],
  completions: HabitCompletionRecord[],
  period: ProgressPeriod,
  today = new Date(),
): ProgressSummary {
  const todayKey = formatLocalDateKey(today);
  const habitIds = new Set(habits.map((habit) => habit.id));
  const periodLength = getPeriodLength(period);
  const periodDates = Array.from({ length: periodLength }, (_, index) =>
    addDays(todayKey, index - periodLength + 1),
  );
  const periodDateSet = new Set(periodDates);
  const periodCompletions = completions.filter(
    (completion) => habitIds.has(completion.habitId) && periodDateSet.has(completion.completedOn),
  );
  const points = periodDates.map((date) => {
    const completionCount = periodCompletions.filter(
      (completion) => completion.completedOn === date,
    ).length;

    return {
      date,
      completionCount,
      completionRate: habits.length > 0 ? Math.round((completionCount / habits.length) * 100) : 0,
    };
  });
  const totalPossibleCompletions = habits.length * periodLength;
  const activeHabitIds = new Set(periodCompletions.map((completion) => completion.habitId));

  return {
    period,
    totalHabits: habits.length,
    totalCompletions: periodCompletions.length,
    completionRate:
      totalPossibleCompletions > 0
        ? Math.round((periodCompletions.length / totalPossibleCompletions) * 100)
        : 0,
    activeHabitCount: activeHabitIds.size,
    hasEnoughData: habits.length > 0 && periodCompletions.length > 0,
    points,
  };
}

export async function completeHabitForToday(
  habit: HabitRecord,
  repository: HabitCompletionRepository,
  today = new Date(),
): Promise<CompleteHabitResult> {
  const completedOn = formatLocalDateKey(today);

  try {
    const existingCompletion = await repository.findByHabitDate(habit.id, completedOn);

    if (existingCompletion) {
      const habitCompletions = await repository.listByHabit(habit.id);

      return {
        completion: existingCompletion,
        didCreate: false,
        currentStreak: calculateCurrentStreak(habitCompletions, completedOn),
      };
    }

    const completion: HabitCompletionRecord = {
      id: createCompletionId(),
      accountId: habit.accountId,
      habitId: habit.id,
      completedOn,
      completedAt: today.toISOString(),
    };

    await repository.create(completion);

    const habitCompletions = await repository.listByHabit(habit.id);

    return {
      completion,
      didCreate: true,
      currentStreak: calculateCurrentStreak(habitCompletions, completedOn),
    };
  } catch {
    throw new CompleteHabitError('HABIT_COMPLETION_UNAVAILABLE');
  }
}
