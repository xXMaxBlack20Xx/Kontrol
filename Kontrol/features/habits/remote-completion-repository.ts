import { apiRequest } from '@/features/api/api';

import type { HabitCompletionRecord, HabitCompletionRepository } from './completion';

type ApiCompletion = {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completedAt: string;
  source: 'mobile';
  createdAt: string;
  updatedAt: string;
};

function toCompletionRecord(completion: ApiCompletion): HabitCompletionRecord {
  return {
    id: completion.id,
    accountId: completion.userId,
    habitId: completion.habitId,
    completedOn: completion.date,
    completedAt: completion.completedAt,
  };
}

async function listCompletions(query?: Record<string, string>): Promise<HabitCompletionRecord[]> {
  const response = await apiRequest<{ completions: ApiCompletion[] }>('/completions', { query });

  return response.completions.map(toCompletionRecord);
}

export const remoteCompletionRepository: HabitCompletionRepository = {
  async create(completion) {
    await apiRequest<{ completion: ApiCompletion }>('/completions', {
      body: {
        habitId: completion.habitId,
        date: completion.completedOn,
        completedAt: completion.completedAt,
      },
      method: 'POST',
    });
  },
  async findByHabitDate(habitId, completedOn) {
    const completions = await listCompletions({
      from: completedOn,
      habitId,
      to: completedOn,
    });

    return completions[0] ?? null;
  },
  async listByAccount() {
    return listCompletions();
  },
  async listByHabit(habitId) {
    return listCompletions({ habitId });
  },
};
