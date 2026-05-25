import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { devicesContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { DeviceDocument } from "../lib/models";
import { deleteInstallation } from "../lib/notifications";

export async function deleteDevice(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const deviceId = req.params.deviceId;
    if (!deviceId) return badRequest("Missing deviceId");

    const existing = await readItem<DeviceDocument>(devicesContainer(), deviceId, userId);
    if (!existing) return notFound("Device not found");

    const updated: DeviceDocument = { ...existing, enabled: false, updatedAt: new Date().toISOString() };
    await devicesContainer().item(deviceId, userId).replace(updated);

    if (existing.notificationHubInstallationId) {
      try {
        await deleteInstallation(existing.notificationHubInstallationId);
      } catch (error) {
        context.log("Notification Hubs installation delete failed", { deviceId, error: error instanceof Error ? error.message : "unknown" });
      }
    }

    return ok({ success: true });
  } catch (error) {
    context.error("Delete device failed", error);
    return serverError();
  }
}

app.http("deleteDevice", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "devices/{deviceId}",
  handler: deleteDevice,
});
