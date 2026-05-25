import type { DeviceDocument } from "./models";
import { createHmac } from "node:crypto";

type NotificationResult = {
  available: boolean;
  sent: number;
  failed: number;
  warning?: string;
};

type HubConfig = {
  endpoint: string;
  hubName: string;
  keyName: string;
  key: string;
};

const parseConnectionString = (): HubConfig | null => {
  const connectionString = process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING;
  const hubName = process.env.AZURE_NOTIFICATION_HUB_NAME;

  if (!connectionString || !hubName) {
    return null;
  }

  const parts = Object.fromEntries(
    connectionString
      .split(";")
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        return separatorIndex === -1 ? [part, ""] : [part.slice(0, separatorIndex), part.slice(separatorIndex + 1)];
      })
      .filter(([key, value]) => key && value),
  );

  if (!parts.Endpoint || !parts.SharedAccessKeyName || !parts.SharedAccessKey) {
    return null;
  }

  return {
    endpoint: parts.Endpoint.replace(/^sb:/, "https:").replace(/\/$/, ""),
    hubName,
    keyName: parts.SharedAccessKeyName,
    key: parts.SharedAccessKey,
  };
};

const createSasToken = async (resourceUri: string, keyName: string, key: string): Promise<string> => {
  const encodedResourceUri = encodeURIComponent(resourceUri.toLowerCase());
  const expiry = Math.floor(Date.now() / 1000) + 5 * 60;
  const stringToSign = `${encodedResourceUri}\n${expiry}`;
  const signature = createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign).digest("base64");
  const encodedSignature = encodeURIComponent(signature);

  return `SharedAccessSignature sr=${encodedResourceUri}&sig=${encodedSignature}&se=${expiry}&skn=${keyName}`;
};

export const notificationHubConfigured = (): boolean => parseConnectionString() !== null;

export const registerInstallation = async (device: DeviceDocument): Promise<{ registered: boolean; warning?: string }> => {
  const config = parseConnectionString();

  if (!config) {
    return { registered: false, warning: "Notification Hubs is not configured" };
  }

  const installationId = device.notificationHubInstallationId ?? device.id;
  const url = `${config.endpoint}/${config.hubName}/installations/${installationId}?api-version=2020-06`;
  const authorization = await createSasToken(url, config.keyName, config.key);
  const platform = device.pushProvider === "apns" ? "apns" : "fcmv1";
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      installationId,
      platform,
      pushChannel: device.nativePushToken,
      tags: [`user:${device.userId}`, `device:${device.id}`],
    }),
  });

  if (!response.ok) {
    return { registered: false, warning: `Notification Hubs registration failed with ${response.status}` };
  }

  return { registered: true };
};

export const deleteInstallation = async (installationId: string): Promise<void> => {
  const config = parseConnectionString();

  if (!config) {
    return;
  }

  const url = `${config.endpoint}/${config.hubName}/installations/${installationId}?api-version=2020-06`;
  const authorization = await createSasToken(url, config.keyName, config.key);
  await fetch(url, { method: "DELETE", headers: { Authorization: authorization } });
};

export const sendTestNotification = async (
  devices: DeviceDocument[],
  payload: { title: string; body: string },
): Promise<NotificationResult> => {
  const config = parseConnectionString();
  const enabledDevices = devices.filter((device) => device.enabled);

  if (!config) {
    return {
      available: false,
      sent: 0,
      failed: 0,
      warning: "Notification Hubs is not configured",
    };
  }

  let sent = 0;
  let failed = 0;

  for (const device of enabledDevices) {
    const url = `${config.endpoint}/${config.hubName}/messages/?api-version=2015-01`;
    const authorization = await createSasToken(url, config.keyName, config.key);
    const isIos = device.pushProvider === "apns";
    const body = isIos
      ? JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: "default" } })
      : JSON.stringify({ message: { token: device.nativePushToken, notification: payload } });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json;charset=utf-8",
        "ServiceBusNotification-Format": isIos ? "apple" : "fcmv1",
        "ServiceBusNotification-Tags": `device:${device.id}`,
      },
      body,
    });

    if (response.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { available: true, sent, failed };
};
