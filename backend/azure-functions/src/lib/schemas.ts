import { z } from "zod";

const email = z.string().trim().email();
const password = z.string().min(8);
const refreshToken = z.string().trim().min(1);
const nonEmptyString = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).max(120).nullable().optional();
const optionalTextList = z.array(z.string().trim().min(1).max(40)).max(12).optional();
const habitName = z.string().trim().min(1).max(80);
const title = z.string().trim().min(1).max(120);
const goalText = z.string().trim().min(1).max(120).nullable().optional();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");
const isoDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected valid ISO date");
const time24h = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm format");
const daysOfWeek = z.array(z.number().int().min(0).max(6)).min(1).max(7);
const allowedImageContentType = z.enum(["image/jpeg", "image/png", "image/webp"]);
const fileExtension = z.enum(["jpg", "jpeg", "png", "webp"]);
const photoId = z.string().trim().min(1).max(120);
const photoPurpose = z.enum(["habit-cover", "profile"]);

export const registerSchema = z.object({
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password,
});

export const refreshSchema = z.object({
  refreshToken,
});

export const logoutSchema = z.object({
  refreshToken,
});

export const createHabitSchema = z.object({
  name: habitName,
  category: optionalText,
  subcategories: optionalTextList,
  frequency: nonEmptyString,
  daysOfWeek: daysOfWeek.optional(),
  goal: goalText,
  color: optionalText,
  icon: optionalText,
});

export const updateHabitSchema = z
  .object({
    name: habitName.optional(),
    category: optionalText,
    subcategories: optionalTextList,
    frequency: nonEmptyString.optional(),
    daysOfWeek: daysOfWeek.optional(),
    goal: goalText,
    color: optionalText,
    icon: optionalText,
    coverPhotoId: z.string().trim().min(1).max(120).nullable().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const syncHabitsSchema = z.object({
  habits: z.array(
    z.object({
      id: nonEmptyString,
      name: habitName,
      category: optionalText,
      subcategories: optionalTextList,
      frequency: nonEmptyString,
      daysOfWeek: daysOfWeek.optional(),
      goal: goalText,
      color: optionalText,
      icon: optionalText,
      coverPhotoId: z.string().trim().min(1).max(120).nullable().optional(),
      isArchived: z.boolean().optional().default(false),
      isDeleted: z.boolean().optional().default(false),
      syncVersion: z.number().int().min(0).optional().default(1),
      createdAt: isoDateTime.optional(),
      updatedAt: isoDateTime,
    }),
  ),
  lastSyncAt: isoDateTime.optional(),
});

export const createCompletionSchema = z.object({
  habitId: nonEmptyString,
  date: dateOnly,
  completedAt: isoDateTime.optional(),
});

export const completionQuerySchema = z
  .object({
    habitId: nonEmptyString.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, "from must be before or equal to to");

export const progressQuerySchema = z
  .object({
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, "from must be before or equal to to");

export const createReminderSchema = z.object({
  habitId: nonEmptyString,
  title,
  time: time24h,
    daysOfWeek,
  enabled: z.boolean().optional().default(true),
  timezone: nonEmptyString.max(80),
});

export const updateReminderSchema = z
  .object({
    title: title.optional(),
    time: time24h.optional(),
    daysOfWeek: daysOfWeek.optional(),
    enabled: z.boolean().optional(),
    timezone: nonEmptyString.max(80).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const createPhotoUploadUrlSchema = z
  .object({
    habitId: nonEmptyString.optional(),
    purpose: photoPurpose.optional().default("habit-cover"),
    contentType: allowedImageContentType,
    fileExtension,
  })
  .superRefine((value, context) => {
    if (value.purpose === "habit-cover" && !value.habitId) {
      context.addIssue({ code: "custom", message: "habitId is required for habit cover photos", path: ["habitId"] });
    }
  });

export const createPhotoMetadataSchema = z
  .object({
    photoId,
    habitId: nonEmptyString.optional(),
    purpose: photoPurpose.optional().default("habit-cover"),
    blobPath: z.string().trim().min(1).max(500),
    contentType: allowedImageContentType,
    sizeBytes: z.number().int().positive().max(10_000_000),
  })
  .superRefine((value, context) => {
    if (value.purpose === "habit-cover" && !value.habitId) {
      context.addIssue({ code: "custom", message: "habitId is required for habit cover photos", path: ["habitId"] });
    }
  });

export const updateProfilePhotoSchema = z.object({
  photoId: photoId.nullable(),
});

export const registerDeviceSchema = z.object({
  platform: z.enum(["ios", "android"]),
  nativePushToken: z.string().trim().min(1).max(4096),
  deviceName: z.string().trim().min(1).max(120).optional(),
  appVersion: z.string().trim().min(1).max(40).optional(),
});

export const sendTestNotificationSchema = z.object({
  title: title.default("Kontrol"),
  body: z.string().trim().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type SyncHabitsInput = z.infer<typeof syncHabitsSchema>;
export type CreateCompletionInput = z.infer<typeof createCompletionSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type CreatePhotoUploadUrlInput = z.infer<typeof createPhotoUploadUrlSchema>;
export type CreatePhotoMetadataInput = z.infer<typeof createPhotoMetadataSchema>;
export type UpdateProfilePhotoInput = z.infer<typeof updateProfilePhotoSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type SendTestNotificationInput = z.infer<typeof sendTestNotificationSchema>;
