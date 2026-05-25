import { apiGet } from '@/features/api/api';

import type { ProgressPeriod, ProgressSummary } from './completion';

type ApiProgress = {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  completedToday: number;
  completionRate: number;
};

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function periodQuery(period: ProgressPeriod): Record<string, string> {
  const today = new Date();
  const days = period === 'weekly' ? 6 : 29;

  return {
    from: formatDateKey(addDays(today, -days)),
    to: formatDateKey(today),
  };
}

export async function getRemoteProgress(period: ProgressPeriod): Promise<ProgressSummary> {
  const response = await apiGet<{ progress: ApiProgress }>('/progress', {
    query: periodQuery(period),
  });
  const progress = response.progress;
  const totalHabits = progress.totalHabits ?? 0;
  const totalCompletions = progress.totalCompletions ?? 0;
  const activeHabits = progress.activeHabits ?? 0;
  const completedToday = progress.completedToday ?? 0;
  const completionRate = Math.round((progress.completionRate ?? 0) * 100);

  return {
    period,
    totalHabits,
    totalCompletions,
    completionRate,
    activeHabitCount: activeHabits,
    hasEnoughData: totalHabits > 0 && totalCompletions > 0,
    points: [
      {
        date: formatDateKey(new Date()),
        completionCount: completedToday,
        completionRate,
      },
    ],
  };
}
