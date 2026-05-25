import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { ReminderNotificationScheduler } from './reminder';
import type { NotificationPermissionsStatus } from 'expo-notifications';

type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotificationsModule | null> | null = null;

function isAndroidExpoGo(): boolean {
  return (
    Platform.OS === 'android' &&
    (Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
  );
}

function hasNotificationPermission(
  permissions: NotificationPermissionsStatus,
  notifications: ExpoNotificationsModule,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function getNotificationsModule(): Promise<ExpoNotificationsModule | null> {
  if (isAndroidExpoGo()) {
    return null;
  }

  notificationsModulePromise ??= import('expo-notifications')
    .then((notifications) => {
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      return notifications;
    })
    .catch(() => null);

  return notificationsModulePromise;
}

export async function getLocalNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
  const notifications = await getNotificationsModule();

  if (!notifications) {
    return 'unavailable';
  }

  const permissions = await notifications.getPermissionsAsync();

  if (hasNotificationPermission(permissions, notifications)) {
    return 'granted';
  }

  return permissions.status === notifications.PermissionStatus.DENIED ? 'denied' : 'undetermined';
}

export async function requestLocalNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'unavailable'> {
  return expoNotificationScheduler.requestPermission();
}

export async function getNativeDevicePushToken(): Promise<string | null> {
  const notifications = await getNotificationsModule();

  if (!notifications) {
    return null;
  }

  try {
    const token = await notifications.getDevicePushTokenAsync();

    return token.data;
  } catch {
    return null;
  }
}

export const expoNotificationScheduler: ReminderNotificationScheduler = {
  async requestPermission() {
    const notifications = await getNotificationsModule();

    if (!notifications) {
      return 'unavailable';
    }

    const currentPermissions = await notifications.getPermissionsAsync();

    if (hasNotificationPermission(currentPermissions, notifications)) {
      return 'granted';
    }

    const requestedPermissions = await notifications.requestPermissionsAsync();

    return hasNotificationPermission(requestedPermissions, notifications) ? 'granted' : 'denied';
  },
  async scheduleDailyReminder({ habitName, time }) {
    const notifications = await getNotificationsModule();

    if (!notifications) {
      throw new Error('Notifications are unavailable in this runtime.');
    }

    const [hour, minute] = time.split(':').map(Number);

    return notifications.scheduleNotificationAsync({
      content: {
        title: 'Kontrol',
        body: `Es hora de ${habitName}.`,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  },
  async cancelReminder(notificationId) {
    const notifications = await getNotificationsModule();

    if (!notifications) {
      return;
    }

    await notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
