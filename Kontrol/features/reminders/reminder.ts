export type ReminderRecord = {
  id: string;
  accountId: string;
  habitId: string;
  time: string;
  notificationId: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveReminderInput = {
  accountId: string;
  habitId: string;
  habitName: string;
  time: string;
};

export type DeleteReminderInput = {
  habitId: string;
  confirmed: boolean;
};

export type ReminderRepository = {
  findByHabitId(habitId: string): Promise<ReminderRecord | null>;
  listByAccount(accountId: string): Promise<ReminderRecord[]>;
  upsert(reminder: ReminderRecord): Promise<void>;
  removeByHabitId(habitId: string): Promise<boolean>;
};

export type ReminderPermissionStatus = 'granted' | 'denied' | 'unavailable';

export type ReminderNotificationScheduler = {
  requestPermission(): Promise<ReminderPermissionStatus>;
  scheduleDailyReminder(input: { habitName: string; time: string }): Promise<string>;
  cancelReminder(notificationId: string): Promise<void>;
};

export type ReminderErrorCode =
  | 'HABIT_REQUIRED'
  | 'TIME_REQUIRED'
  | 'TIME_INVALID'
  | 'NOTIFICATION_PERMISSION_REQUIRED'
  | 'NOTIFICATIONS_UNAVAILABLE'
  | 'CONFIRMATION_REQUIRED'
  | 'REMINDER_NOT_FOUND'
  | 'REMINDER_SAVE_UNAVAILABLE';

export const reminderErrorMessages: Record<ReminderErrorCode, string> = {
  HABIT_REQUIRED: 'Selecciona un habito para configurar el recordatorio.',
  TIME_REQUIRED: 'Selecciona una hora para el recordatorio.',
  TIME_INVALID: 'Ingresa una hora valida en formato HH:MM.',
  NOTIFICATION_PERMISSION_REQUIRED: 'Activa los permisos de notificacion para programar el recordatorio.',
  NOTIFICATIONS_UNAVAILABLE:
    'Los recordatorios no estan disponibles en Expo Go para Android. Usa una development build para probarlos.',
  CONFIRMATION_REQUIRED: 'Confirma la eliminacion del recordatorio para continuar.',
  REMINDER_NOT_FOUND: 'No se encontro un recordatorio para este habito.',
  REMINDER_SAVE_UNAVAILABLE: 'No se pudo guardar el recordatorio. Intenta nuevamente.',
};

export class ReminderError extends Error {
  code: ReminderErrorCode;

  constructor(code: ReminderErrorCode) {
    super(reminderErrorMessages[code]);
    this.code = code;
  }
}

function createReminderId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `reminder-${Date.now()}`;
}

export function normalizeReminderTime(time: string): string {
  return time.trim();
}

export function validateReminderTime(time: string): ReminderErrorCode | null {
  const normalizedTime = normalizeReminderTime(time);

  if (!normalizedTime) {
    return 'TIME_REQUIRED';
  }

  const match = /^(\d{2}):(\d{2})$/.exec(normalizedTime);

  if (!match) {
    return 'TIME_INVALID';
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return 'TIME_INVALID';
  }

  return null;
}

function validateSaveReminderInput(input: SaveReminderInput): ReminderErrorCode | null {
  if (!input.accountId.trim() || !input.habitId.trim()) {
    return 'HABIT_REQUIRED';
  }

  return validateReminderTime(input.time);
}

export async function saveHabitReminder(
  input: SaveReminderInput,
  repository: ReminderRepository,
  scheduler: ReminderNotificationScheduler,
): Promise<ReminderRecord> {
  const validationError = validateSaveReminderInput(input);

  if (validationError) {
    throw new ReminderError(validationError);
  }

  const permissionStatus = await scheduler.requestPermission();

  if (permissionStatus === 'unavailable') {
    throw new ReminderError('NOTIFICATIONS_UNAVAILABLE');
  }

  if (permissionStatus !== 'granted') {
    throw new ReminderError('NOTIFICATION_PERMISSION_REQUIRED');
  }

  const time = normalizeReminderTime(input.time);

  try {
    const currentReminder = await repository.findByHabitId(input.habitId);

    if (currentReminder) {
      await scheduler.cancelReminder(currentReminder.notificationId);
    }

    const notificationId = await scheduler.scheduleDailyReminder({
      habitName: input.habitName.trim() || 'tu habito',
      time,
    });
    const now = new Date().toISOString();
    const reminder: ReminderRecord = {
      id: currentReminder?.id ?? createReminderId(),
      accountId: input.accountId,
      habitId: input.habitId,
      time,
      notificationId,
      createdAt: currentReminder?.createdAt ?? now,
      updatedAt: now,
    };

    await repository.upsert(reminder);

    return reminder;
  } catch (error) {
    if (error instanceof ReminderError) {
      throw error;
    }

    throw new ReminderError('REMINDER_SAVE_UNAVAILABLE');
  }
}

export async function deleteHabitReminder(
  input: DeleteReminderInput,
  repository: ReminderRepository,
  scheduler: ReminderNotificationScheduler,
): Promise<ReminderRecord> {
  if (!input.confirmed) {
    throw new ReminderError('CONFIRMATION_REQUIRED');
  }

  if (!input.habitId.trim()) {
    throw new ReminderError('HABIT_REQUIRED');
  }

  try {
    const reminder = await repository.findByHabitId(input.habitId);

    if (!reminder) {
      throw new ReminderError('REMINDER_NOT_FOUND');
    }

    await scheduler.cancelReminder(reminder.notificationId);

    const wasRemoved = await repository.removeByHabitId(input.habitId);

    if (!wasRemoved) {
      throw new ReminderError('REMINDER_NOT_FOUND');
    }

    return reminder;
  } catch (error) {
    if (error instanceof ReminderError) {
      throw error;
    }

    throw new ReminderError('REMINDER_SAVE_UNAVAILABLE');
  }
}
