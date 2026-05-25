import { ApiError, apiRequest } from '@/features/api/api';
import { getPhoto } from '@/features/api/photo-service';

import type { HabitRecord, HabitRepository } from './habit';

type ApiHabit = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  subcategories?: string[];
  frequency: string;
  daysOfWeek?: number[];
  goal: string | null;
  color: string | null;
  icon: string | null;
  coverPhotoId?: string | null;
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

async function getCoverPhotoUrl(coverPhotoId?: string | null): Promise<string | undefined> {
  if (!coverPhotoId) {
    return undefined;
  }

  try {
    const response = await getPhoto(coverPhotoId);

    return response.readUrl;
  } catch {
    return undefined;
  }
}

async function toHabitRecord(habit: ApiHabit): Promise<HabitRecord> {
  return {
    id: habit.id,
    accountId: habit.userId,
    name: habit.name,
    frequency: habit.frequency === 'custom' ? 'custom' : 'daily',
    category: habit.category ?? undefined,
    subcategories: habit.subcategories?.filter(Boolean),
    daysOfWeek: habit.daysOfWeek,
    color: habit.color ?? undefined,
    icon: habit.icon ?? undefined,
    coverPhotoId: habit.coverPhotoId ?? undefined,
    coverPhotoUrl: await getCoverPhotoUrl(habit.coverPhotoId),
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
        subcategories: habit.subcategories ?? [],
        frequency: habit.frequency,
        daysOfWeek: habit.daysOfWeek,
        goal: optionalText(habit.target),
        color: optionalText(habit.color),
        icon: optionalText(habit.icon),
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
        subcategories: habit.subcategories ?? [],
        frequency: habit.frequency,
        daysOfWeek: habit.daysOfWeek,
        goal: optionalText(habit.target),
        color: optionalText(habit.color),
        icon: optionalText(habit.icon),
        coverPhotoId: optionalText(habit.coverPhotoId),
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

    return Promise.all(response.habits.map(toHabitRecord));
  },
};
