import { apiDelete, apiGet, apiPost } from './api';

export type DeviceRecord = {
  id: string;
  userId: string;
  platform: 'ios' | 'android';
  pushProvider: 'apns' | 'fcmv1';
  nativePushToken: string;
  notificationHubInstallationId: string | null;
  deviceName: string | null;
  appVersion: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export function registerDevice(input: {
  platform: 'ios' | 'android';
  nativePushToken: string;
  deviceName?: string;
  appVersion?: string;
}): Promise<{ device: DeviceRecord; notificationHubRegistered: boolean; warning?: string }> {
  return apiPost<{ device: DeviceRecord; notificationHubRegistered: boolean; warning?: string }>('/devices/register', input);
}

export function listDevices(): Promise<{ devices: DeviceRecord[] }> {
  return apiGet<{ devices: DeviceRecord[] }>('/devices');
}

export function deleteDevice(deviceId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/devices/${encodeURIComponent(deviceId)}`);
}

export function sendTestNotification(input: { title?: string; body: string }): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  warning?: string;
}> {
  return apiPost<{ success: boolean; sent: number; failed: number; warning?: string }>('/notifications/send-test', input);
}
