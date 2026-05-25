import { ApiError, apiRequest } from '@/features/api/api';

import type { HabitRecord, HabitRepository } from './habit';

type ApiHabit = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  frequency: string;
  goal: string | null;
  color: string | null;
  icon: string | null;
  isArchived: boolean;
  isDeleted: boolean;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
};

function optionalText(value?: string): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function toHabitRecord(habit: ApiHabit): HabitRecord {
  return {
    id: habit.id,
    accountId: habit.userId,
    name: habit.name,
    frequency: habit.frequency === 'daily' ? 'daily' : 'daily',
    category: habit.category ?? undefined,
    target: habit.goal ?? undefined,
    createdAt: habit.createdAt,
  };
}

export const remoteHabitRepository: HabitRepository = {
  async create(habit) {
    const response = await apiRequest<{ habit: ApiHabit }>('/habits', {
      body: {
        name: habit.name,
        category: optionalText(habit.category),
        frequency: habit.frequency,
        goal: optionalText(habit.target),
        color: null,
        icon: null,
      },
      method: 'POST',
    });

    return toHabitRecord(response.habit);
  },
  async update(habit) {
    const response = await apiRequest<{ habit: ApiHabit }>(`/habits/${encodeURIComponent(habit.id)}`, {
      body: {
        name: habit.name,
        category: optionalText(habit.category),
        frequency: habit.frequency,
        goal: optionalText(habit.target),
      },
      method: 'PUT',
    });

    return toHabitRecord(response.habit);
  },
  async remove(habitId) {
    try {
      await apiRequest<{ success: boolean }>(`/habits/${encodeURIComponent(habitId)}`, {
        method: 'DELETE',
      });

      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }

      throw error;
    }
  },
  async listByAccount() {
    const response = await apiRequest<{ habits: ApiHabit[] }>('/habits');

    return response.habits.map(toHabitRecord);
  },
};
