import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { devicesContainer, queryItems } from "../lib/cosmos";
import { badRequest, isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { DeviceDocument } from "../lib/models";
import { sendTestNotification as sendNotificationHubTest } from "../lib/notifications";
import { sendTestNotificationSchema } from "../lib/schemas";

export async function sendTestNotification(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = sendTestNotificationSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const devices = await queryItems<DeviceDocument>(
      devicesContainer(),
      "SELECT * FROM c WHERE c.userId = @userId AND c.enabled = true",
      [{ name: "@userId", value: userId }],
      userId,
    );
    const result = await sendNotificationHubTest(devices, parsed.data);

    context.log("Test notification requested", { userId, enabledDevices: devices.length, sent: result.sent, failed: result.failed });

    return ok({ success: true, sent: result.sent, failed: result.failed, ...(result.warning ? { warning: result.warning } : {}) });
  } catch (error) {
    context.error("Send test notification failed", error);
    return serverError();
  }
}

app.http("sendTestNotification", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/send-test",
  handler: sendTestNotification,
});
