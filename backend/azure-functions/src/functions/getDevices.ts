import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { devicesContainer, queryItems } from "../lib/cosmos";
import { isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { DeviceDocument } from "../lib/models";

export async function getDevices(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const devices = await queryItems<DeviceDocument>(
      devicesContainer(),
      "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      [{ name: "@userId", value: userId }],
      userId,
    );

    return ok({ devices });
  } catch (error) {
    context.error("Get devices failed", error);
    return serverError();
  }
}

app.http("getDevices", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "devices",
  handler: getDevices,
});
