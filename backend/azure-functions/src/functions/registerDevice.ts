import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { AuthenticationError, requireUser } from "../lib/auth";
import { devicesContainer } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, serverError, unauthorized } from "../lib/http";
import type { DeviceDocument } from "../lib/models";
import { registerInstallation } from "../lib/notifications";
import { registerDeviceSchema } from "../lib/schemas";

export async function registerDevice(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = registerDeviceSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const now = new Date().toISOString();
    const deviceId = `device_${uuidv4()}`;
    const device: DeviceDocument = {
      id: deviceId,
      userId,
      platform: parsed.data.platform,
      pushProvider: parsed.data.platform === "ios" ? "apns" : "fcmv1",
      nativePushToken: parsed.data.nativePushToken,
      notificationHubInstallationId: `installation_${deviceId}`,
      deviceName: parsed.data.deviceName ?? null,
      appVersion: parsed.data.appVersion ?? null,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    let notificationHubRegistered = false;
    let warning: string | undefined;
    try {
      const registration = await registerInstallation(device);
      notificationHubRegistered = registration.registered;
      warning = registration.warning;
    } catch (error) {
      warning = "Notification Hubs registration failed";
      context.error("Notification Hubs registration failed", error);
    }

    await devicesContainer().items.create(device);
    context.log("Device registered", { deviceId, userId, notificationHubRegistered });

    return created({ device, notificationHubRegistered, ...(warning ? { warning } : {}) });
  } catch (error) {
    context.error("Register device failed", error);
    return serverError();
  }
}

app.http("registerDevice", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "devices/register",
  handler: registerDevice,
});
