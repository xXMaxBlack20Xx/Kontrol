import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/account/auth-context';

import type { HabitCompletionRecord } from './completion';
import type { HabitRecord } from './habit';
import { calculateProgressDashboard, type ProgressDashboard } from './progress-helpers';
import { remoteCompletionRepository } from './remote-completion-repository';
import { remoteHabitRepository } from './remote-habit-repository';
import { getRemoteProgress } from './remote-progress-service';

type LoadOptions = {
  showSpinner?: boolean;
};

export function useProgressScreenController() {
  const router = useRouter();
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressDashboard | null>(null);
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [completions, setCompletions] = useState<HabitCompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (options: LoadOptions = {}) => {
    const showSpinner = options.showSpinner ?? true;

    if (!user) {
      setProgress(null);
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const [storedHabits, storedCompletions] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        remoteCompletionRepository.listByAccount(user.accountId),
        getRemoteProgress('weekly').catch(() => null),
      ]);

      setHabits(storedHabits);
      setCompletions(storedCompletions);
      setProgress(calculateProgressDashboard(storedHabits, storedCompletions));
    } catch {
      setProgress(null);
      setHabits([]);
      setCompletions([]);
      setError('No se pudo cargar tu progreso desde Kontrol. Revisa tu conexión e intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      reload({ showSpinner: true });
    }, [reload]),
  );

  return {
    completions,
    error,
    habits,
    loading,
    progress,
    refreshing,
    reload,
    navigateToCreateHabit: () => router.push('/(app)/habits/create' as Href),
    navigateToHabits: () => router.push('/(app)/(tabs)/habits' as Href),
    user,
  };
}
