export type HabitFrequency = 'daily';

export type HabitRecord = {
  id: string;
  accountId: string;
  name: string;
  frequency: HabitFrequency;
  category?: string;
  target?: string;
  reminderTime?: string;
  createdAt: string;
};

export type CreateHabitInput = {
  accountId: string;
  name: string;
  frequency: string;
  category?: string;
  target?: string;
  reminderTime?: string;
};

export type EditHabitInput = {
  name?: string;
  frequency?: string;
  category?: string;
  target?: string;
  reminderTime?: string;
};

export type HabitRepository = {
  create(habit: HabitRecord): Promise<void>;
  update(habit: HabitRecord): Promise<void>;
  remove(habitId: string): Promise<boolean>;
  listByAccount(accountId: string): Promise<HabitRecord[]>;
};

export type CreateHabitErrorCode =
  | 'NAME_REQUIRED'
  | 'FREQUENCY_REQUIRED'
  | 'HABIT_CREATION_UNAVAILABLE';

export const createHabitErrorMessages: Record<CreateHabitErrorCode, string> = {
  NAME_REQUIRED: 'Ingresa un nombre para el hábito.',
  FREQUENCY_REQUIRED: 'Selecciona una frecuencia válida.',
  HABIT_CREATION_UNAVAILABLE: 'No se pudo crear el hábito. Intenta nuevamente.',
};

export class CreateHabitError extends Error {
  code: CreateHabitErrorCode;

  constructor(code: CreateHabitErrorCode) {
    super(createHabitErrorMessages[code]);
    this.code = code;
  }
}

export type EditHabitErrorCode = 'NAME_REQUIRED' | 'FREQUENCY_REQUIRED' | 'HABIT_EDIT_UNAVAILABLE';

export const editHabitErrorMessages: Record<EditHabitErrorCode, string> = {
  NAME_REQUIRED: 'Ingresa un nombre para el hábito.',
  FREQUENCY_REQUIRED: 'Selecciona una frecuencia válida.',
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

function isHabitFrequency(value: string): value is HabitFrequency {
  return value === 'daily';
}

export function validateCreateHabitInput(input: CreateHabitInput): CreateHabitErrorCode | null {
  if (!input.name.trim()) {
    return 'NAME_REQUIRED';
  }

  if (!isHabitFrequency(input.frequency)) {
    return 'FREQUENCY_REQUIRED';
  }

  return null;
}

export function validateEditHabitInput(input: EditHabitInput): EditHabitErrorCode | null {
  if (input.name !== undefined && !input.name.trim()) {
    return 'NAME_REQUIRED';
  }

  if (input.frequency !== undefined && !isHabitFrequency(input.frequency)) {
    return 'FREQUENCY_REQUIRED';
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
      target: normalizeOptionalText(input.target),
      reminderTime: normalizeOptionalText(input.reminderTime),
      createdAt: new Date().toISOString(),
    };

    await repository.create(habit);

    return habit;
  } catch (error) {
    if (error instanceof CreateHabitError) {
      throw error;
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
      target: input.target !== undefined ? normalizeOptionalText(input.target) : currentHabit.target,
      reminderTime:
        input.reminderTime !== undefined
          ? normalizeOptionalText(input.reminderTime)
          : currentHabit.reminderTime,
    };

    await repository.update(updatedHabit);

    return updatedHabit;
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
