import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { queryItems, remindersContainer } from "../lib/cosmos";
import { isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { ReminderDocument } from "../lib/models";

export async function getReminders(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const reminders = await queryItems<ReminderDocument>(
      remindersContainer(),
      "SELECT * FROM c WHERE c.userId = @userId AND c.isDeleted = false ORDER BY c.updatedAt DESC",
      [{ name: "@userId", value: userId }],
      userId,
    );

    return ok({ reminders });
  } catch (error) {
    context.error("Get reminders failed", error);
    return serverError();
  }
}

app.http("getReminders", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reminders",
  handler: getReminders,
});
