export type HabitFrequency = 'daily' | 'custom';

export type HabitRecord = {
  id: string;
  accountId: string;
  name: string;
  frequency: HabitFrequency;
  category?: string;
  subcategories?: string[];
  daysOfWeek?: number[];
  color?: string;
  icon?: string;
  coverPhotoId?: string;
  coverPhotoUrl?: string;
  target?: string;
  reminderTime?: string;
  createdAt: string;
};

export type CreateHabitInput = {
  accountId: string;
  name: string;
  frequency: string;
  category?: string;
  subcategories?: string[];
  daysOfWeek?: number[];
  color?: string;
  icon?: string;
  coverPhotoId?: string;
  target?: string;
  reminderTime?: string;
};

export type EditHabitInput = {
  name?: string;
  frequency?: string;
  category?: string;
  subcategories?: string[];
  daysOfWeek?: number[];
  color?: string;
  icon?: string;
  coverPhotoId?: string;
  target?: string;
  reminderTime?: string;
};

export type HabitRepository = {
  create(habit: HabitRecord): Promise<HabitRecord | void>;
  update(habit: HabitRecord): Promise<HabitRecord | void>;
  remove(habitId: string): Promise<boolean>;
  listByAccount(accountId: string): Promise<HabitRecord[]>;
};

const orderedDaysOfWeek = [1, 2, 3, 4, 5, 6, 0];
const shortDayLabels: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

function sameDaySet(daysOfWeek: number[], expectedDays: number[]): boolean {
  const daySet = new Set(daysOfWeek);

  return daySet.size === expectedDays.length && expectedDays.every((day) => daySet.has(day));
}

export function formatHabitDays(daysOfWeek?: number[]): string {
  const normalizedDays = normalizeDaysOfWeek(daysOfWeek) ?? [0, 1, 2, 3, 4, 5, 6];

  if (sameDaySet(normalizedDays, [0, 1, 2, 3, 4, 5, 6])) {
    return 'Todos los días';
  }

  if (sameDaySet(normalizedDays, [1, 2, 3, 4, 5])) {
    return 'Entre semana';
  }

  if (sameDaySet(normalizedDays, [0, 6])) {
    return 'Fines de semana';
  }

  return orderedDaysOfWeek
    .filter((day) => normalizedDays.includes(day))
    .map((day) => shortDayLabels[day])
    .join(', ');
}

export type CreateHabitErrorCode =
  | HabitNameErrorCode
  | 'FREQUENCY_REQUIRED'
  | 'DAYS_OF_WEEK_REQUIRED'
  | 'HABIT_CREATION_REJECTED'
  | 'HABIT_NETWORK_UNAVAILABLE'
  | 'HABIT_SESSION_EXPIRED'
  | 'HABIT_SERVER_UNAVAILABLE'
  | 'HABIT_CREATION_UNAVAILABLE';

type HabitNameErrorCode = 'NAME_REQUIRED' | 'NAME_TOO_SHORT' | 'NAME_TOO_LONG';

export const createHabitErrorMessages: Record<CreateHabitErrorCode, string> = {
  NAME_REQUIRED: 'Ingresa un nombre para el hábito.',
  NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres.',
  NAME_TOO_LONG: 'El nombre no puede superar 60 caracteres.',
  FREQUENCY_REQUIRED: 'Selecciona una frecuencia válida.',
  DAYS_OF_WEEK_REQUIRED: 'Selecciona al menos un día de la semana.',
  HABIT_CREATION_REJECTED: 'Revisa los datos del hábito e intenta nuevamente.',
  HABIT_NETWORK_UNAVAILABLE: 'No se pudo conectar con Kontrol. Revisa tu conexión e intenta nuevamente.',
  HABIT_SESSION_EXPIRED: 'Tu sesión expiró. Vuelve a iniciar sesión para crear hábitos.',
  HABIT_SERVER_UNAVAILABLE: 'Kontrol no pudo crear el hábito en este momento. Intenta nuevamente.',
  HABIT_CREATION_UNAVAILABLE: 'No se pudo crear el hábito. Intenta nuevamente.',
};

export class CreateHabitError extends Error {
  code: CreateHabitErrorCode;

  constructor(code: CreateHabitErrorCode) {
    super(createHabitErrorMessages[code]);
    this.code = code;
  }
}

export type EditHabitErrorCode =
  | HabitNameErrorCode
  | 'FREQUENCY_REQUIRED'
  | 'DAYS_OF_WEEK_REQUIRED'
  | 'HABIT_EDIT_UNAVAILABLE';

export const editHabitErrorMessages: Record<EditHabitErrorCode, string> = {
  NAME_REQUIRED: 'Ingresa un nombre para el hábito.',
  NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres.',
  NAME_TOO_LONG: 'El nombre no puede superar 60 caracteres.',
  FREQUENCY_REQUIRED: 'Selecciona una frecuencia válida.',
  DAYS_OF_WEEK_REQUIRED: 'Selecciona al menos un día de la semana.',
  HABIT_EDIT_UNAVAILABLE: 'No se pudo guardar la edición. Intenta nuevamente.',
};

export class EditHabitError extends Error {
  code: EditHabitErrorCode;

  constructor(code: EditHabitErrorCode) {
    super(editHabitErrorMessages[code]);
    this.code = code;
  }
}

export type DeleteHabitErrorCode = 'CONFIRMATION_REQUIRED' | 'HABIT_NOT_FOUND' | 'HABIT_DELETE_UNAVAILABLE';

export const deleteHabitErrorMessages: Record<DeleteHabitErrorCode, string> = {
  CONFIRMATION_REQUIRED: 'Confirma la eliminación para continuar.',
  HABIT_NOT_FOUND: 'No se pudo encontrar el hábito para eliminarlo.',
  HABIT_DELETE_UNAVAILABLE: 'No se pudo eliminar el hábito. Intenta nuevamente.',
};

export class DeleteHabitError extends Error {
  code: DeleteHabitErrorCode;

  constructor(code: DeleteHabitErrorCode) {
    super(deleteHabitErrorMessages[code]);
    this.code = code;
  }
}

function createHabitId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `habit-${Date.now()}`;
}

function normalizeOptionalText(value?: string): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function normalizeOptionalTextList(values?: string[]): string[] | undefined {
  const normalizedValues = Array.from(new Set(values?.map((value) => value.trim()).filter(Boolean)));

  return normalizedValues.length > 0 ? normalizedValues : undefined;
}

function normalizeDaysOfWeek(daysOfWeek?: number[]): number[] | undefined {
  const normalizedDays = Array.from(
    new Set(daysOfWeek?.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)),
  ).sort((firstDay, secondDay) => firstDay - secondDay);

  return normalizedDays.length > 0 ? normalizedDays : undefined;
}

function isHabitFrequency(value: string): value is HabitFrequency {
  return value === 'daily' || value === 'custom';
}

function getStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    return typeof status === 'number' ? status : null;
  }

  return null;
}

function validateHabitName(name: string): HabitNameErrorCode | null {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return 'NAME_REQUIRED';
  }

  if (normalizedName.length < 2) {
    return 'NAME_TOO_SHORT';
  }

  if (normalizedName.length > 60) {
    return 'NAME_TOO_LONG';
  }

  return null;
}

export function validateCreateHabitInput(input: CreateHabitInput): CreateHabitErrorCode | null {
  const nameError = validateHabitName(input.name);

  if (nameError) {
    return nameError;
  }

  if (!isHabitFrequency(input.frequency)) {
    return 'FREQUENCY_REQUIRED';
  }

  if (input.daysOfWeek !== undefined && !normalizeDaysOfWeek(input.daysOfWeek)) {
    return 'DAYS_OF_WEEK_REQUIRED';
  }

  return null;
}

export function validateEditHabitInput(input: EditHabitInput): EditHabitErrorCode | null {
  if (input.name !== undefined) {
    const nameError = validateHabitName(input.name);

    if (nameError) {
      return nameError;
    }
  }

  if (input.frequency !== undefined && !isHabitFrequency(input.frequency)) {
    return 'FREQUENCY_REQUIRED';
  }

  if (input.daysOfWeek !== undefined && !normalizeDaysOfWeek(input.daysOfWeek)) {
    return 'DAYS_OF_WEEK_REQUIRED';
  }

  return null;
}

export async function createHabit(
  input: CreateHabitInput,
  repository: HabitRepository,
): Promise<HabitRecord> {
  const validationError = validateCreateHabitInput(input);

  if (validationError) {
    throw new CreateHabitError(validationError);
  }

  try {
    const frequency = input.frequency as HabitFrequency;
    const habit: HabitRecord = {
      id: createHabitId(),
      accountId: input.accountId,
      name: input.name.trim(),
      frequency,
      category: normalizeOptionalText(input.category),
      subcategories: normalizeOptionalTextList(input.subcategories),
      daysOfWeek: normalizeDaysOfWeek(input.daysOfWeek),
      color: normalizeOptionalText(input.color),
      icon: normalizeOptionalText(input.icon),
      coverPhotoId: normalizeOptionalText(input.coverPhotoId),
      target: normalizeOptionalText(input.target),
      reminderTime: normalizeOptionalText(input.reminderTime),
      createdAt: new Date().toISOString(),
    };

    const savedHabit = await repository.create(habit);

    return savedHabit ?? habit;
  } catch (error) {
    if (error instanceof CreateHabitError) {
      throw error;
    }

    const status = getStatusCode(error);

    if (status === 0) {
      throw new CreateHabitError('HABIT_NETWORK_UNAVAILABLE');
    }

    if (status === 400) {
      throw new CreateHabitError('HABIT_CREATION_REJECTED');
    }

    if (status === 401) {
      throw new CreateHabitError('HABIT_SESSION_EXPIRED');
    }

    if (status !== null && status >= 500) {
      throw new CreateHabitError('HABIT_SERVER_UNAVAILABLE');
    }

    throw new CreateHabitError('HABIT_CREATION_UNAVAILABLE');
  }
}

export async function editHabit(
  currentHabit: HabitRecord,
  input: EditHabitInput,
  repository: HabitRepository,
): Promise<HabitRecord> {
  const validationError = validateEditHabitInput(input);

  if (validationError) {
    throw new EditHabitError(validationError);
  }

  try {
    const updatedHabit: HabitRecord = {
      ...currentHabit,
      name: input.name !== undefined ? input.name.trim() : currentHabit.name,
      frequency:
        input.frequency !== undefined ? (input.frequency as HabitFrequency) : currentHabit.frequency,
      category:
        input.category !== undefined ? normalizeOptionalText(input.category) : currentHabit.category,
      subcategories:
        input.subcategories !== undefined
          ? normalizeOptionalTextList(input.subcategories)
          : currentHabit.subcategories,
      daysOfWeek:
        input.daysOfWeek !== undefined ? normalizeDaysOfWeek(input.daysOfWeek) : currentHabit.daysOfWeek,
      color: input.color !== undefined ? normalizeOptionalText(input.color) : currentHabit.color,
      icon: input.icon !== undefined ? normalizeOptionalText(input.icon) : currentHabit.icon,
      coverPhotoId:
        input.coverPhotoId !== undefined ? normalizeOptionalText(input.coverPhotoId) : currentHabit.coverPhotoId,
      target: input.target !== undefined ? normalizeOptionalText(input.target) : currentHabit.target,
      reminderTime:
        input.reminderTime !== undefined
          ? normalizeOptionalText(input.reminderTime)
          : currentHabit.reminderTime,
    };

    const savedHabit = await repository.update(updatedHabit);

    return savedHabit ?? updatedHabit;
  } catch (error) {
    if (error instanceof EditHabitError) {
      throw error;
    }

    throw new EditHabitError('HABIT_EDIT_UNAVAILABLE');
  }
}

export async function deleteHabit(
  habit: HabitRecord | null,
  confirmed: boolean,
  repository: HabitRepository,
): Promise<HabitRecord> {
  if (!confirmed) {
    throw new DeleteHabitError('CONFIRMATION_REQUIRED');
  }

  if (!habit) {
    throw new DeleteHabitError('HABIT_NOT_FOUND');
  }

  try {
    const wasRemoved = await repository.remove(habit.id);

    if (!wasRemoved) {
      throw new DeleteHabitError('HABIT_NOT_FOUND');
    }

    return habit;
  } catch (error) {
    if (error instanceof DeleteHabitError) {
      throw error;
    }

    throw new DeleteHabitError('HABIT_DELETE_UNAVAILABLE');
  }
}
