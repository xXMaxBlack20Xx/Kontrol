export type AuthUserDocument = {
  id: string;
  emailHash: string;
  userId: string;
  normalizedEmail: string;
  passwordHash: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type UserDocument = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  profilePhotoId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RefreshTokenDocument = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type HabitDocument = {
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

export type HabitCompletionDocument = {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completedAt: string;
  source: "mobile";
  createdAt: string;
  updatedAt: string;
};

export type ReminderDocument = {
  id: string;
  userId: string;
  habitId: string;
  title: string;
  time: string;
  daysOfWeek: number[];
  enabled: boolean;
  timezone: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PhotoDocument = {
  id: string;
  userId: string;
  habitId?: string | null;
  purpose?: "habit-cover" | "profile";
  blobPath: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type DeviceDocument = {
  id: string;
  userId: string;
  platform: "ios" | "android";
  pushProvider: "apns" | "fcmv1";
  nativePushToken: string;
  notificationHubInstallationId: string | null;
  deviceName: string | null;
  appVersion: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  userId: string;
  email: string;
  displayName: string | null;
  profilePhotoId: string | null;
};

export const toPublicUser = (user: UserDocument): PublicUser => ({
  userId: user.userId,
  email: user.email,
  displayName: user.displayName,
  profilePhotoId: user.profilePhotoId ?? null,
});
