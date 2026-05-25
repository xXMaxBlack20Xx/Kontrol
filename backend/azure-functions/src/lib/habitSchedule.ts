import type { HabitDocument } from "./models";

function normalizeDateToLocalKey(date: Date | string): string {
  if (typeof date === "string") {
    const dateOnly = date.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

    if (dateOnly) {
      return dateOnly;
    }
  }

  const localDate = typeof date === "string" ? new Date(date) : date;
  const year = localDate.getFullYear();
  const month = `${localDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${localDate.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
}

function isDailyFrequency(frequency: string): boolean {
  const normalizedFrequency = frequency.trim().toLowerCase();

  return normalizedFrequency === "daily" || normalizedFrequency === "diario";
}

export function isHabitScheduledForDate(habit: HabitDocument, date: Date | string): boolean {
  const dateKey = normalizeDateToLocalKey(date);
  const createdAtKey = normalizeDateToLocalKey(habit.createdAt);

  if (dateKey < createdAtKey) {
    return false;
  }

  // El contrato actual usa 0 = domingo, 1 = lunes, ..., 6 = sábado.
  // Fallback legacy: hábitos diarios o sin daysOfWeek se tratan como diarios.
  if (isDailyFrequency(habit.frequency) || !habit.daysOfWeek?.length) {
    return true;
  }

  return habit.daysOfWeek.includes(createLocalDate(dateKey).getDay());
}
