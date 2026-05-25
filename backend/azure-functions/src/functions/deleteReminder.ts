import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { readItem, remindersContainer } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { ReminderDocument } from "../lib/models";

export async function deleteReminder(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const reminderId = req.params.reminderId;
    if (!reminderId) return badRequest("Missing reminderId");

    const existing = await readItem<ReminderDocument>(remindersContainer(), reminderId, userId);
    if (!existing || existing.isDeleted) return notFound("Reminder not found");

    await remindersContainer().item(reminderId, userId).replace({
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    });

    return ok({ success: true });
  } catch (error) {
    context.error("Delete reminder failed", error);
    return serverError();
  }
}

app.http("deleteReminder", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "reminders/{reminderId}",
  handler: deleteReminder,
});
