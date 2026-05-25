import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type HabitIconName = ComponentProps<typeof MaterialIcons>['name'];

export const allDays = [1, 2, 3, 4, 5, 6, 0];
export const weekdayDays = [1, 2, 3, 4, 5];
export const weekendDays = [6, 0];

export const dayOptions = [
  { accessibilityLabel: 'Lunes', label: 'L', value: 1 },
  { accessibilityLabel: 'Martes', label: 'M', value: 2 },
  { accessibilityLabel: 'Miércoles', label: 'M', value: 3 },
  { accessibilityLabel: 'Jueves', label: 'J', value: 4 },
  { accessibilityLabel: 'Viernes', label: 'V', value: 5 },
  { accessibilityLabel: 'Sábado', label: 'S', value: 6 },
  { accessibilityLabel: 'Domingo', label: 'D', value: 0 },
];

export const categoryOptions = ['Salud', 'Ejercicio', 'Estudio', 'Productividad', 'Alimentación', 'Sueño', 'Personal'];

export const subcategoryOptions = [
  'Cardio',
  'Fuerza',
  'Movilidad',
  'Mentalidad',
  'Lectura',
  'Hidratación',
  'Descanso',
  'Nutrición',
  'Enfoque',
  'Productividad',
  'Recuperación',
  'Técnica',
];

export const colorOptions = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
  '#30D5C8',
  '#2F4F9F',
  '#D96C8A',
  '#C47A1B',
];

export const iconOptions: { label: string; value: HabitIconName }[] = [
  { label: 'Meta', value: 'flag' },
  { label: 'Salud', value: 'favorite' },
  { label: 'Ejercicio', value: 'fitness-center' },
  { label: 'Estudio', value: 'menu-book' },
  { label: 'Sueño', value: 'bedtime' },
  { label: 'Agua', value: 'water-drop' },
  { label: 'Mejorar', value: 'trending-up' },
  { label: 'Dieta', value: 'restaurant' },
];

export function getFrequencyFromDays(daysOfWeek: number[]): 'daily' | 'custom' {
  return daysOfWeek.length === 7 ? 'daily' : 'custom';
}

export function sortDays(daysOfWeek: number[]): number[] {
  return dayOptions.map((dayOption) => dayOption.value).filter((day) => daysOfWeek.includes(day));
}

export function normalizeFormDays(daysOfWeek?: number[]): number[] {
  const normalizedDays = sortDays(
    Array.from(new Set(daysOfWeek?.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) ?? [])),
  );

  return normalizedDays.length > 0 ? normalizedDays : allDays;
}

export function dateFromTime(time: string): Date {
  const date = new Date();
  const [hour = 8, minute = 0] = time.split(':').map(Number);

  date.setHours(hour, minute, 0, 0);

  return date;
}

export function formatTime(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${hour}:${minute}`;
}
