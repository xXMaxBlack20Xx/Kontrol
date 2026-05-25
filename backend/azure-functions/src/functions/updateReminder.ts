import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { readItem, remindersContainer } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { ReminderDocument } from "../lib/models";
import { updateReminderSchema } from "../lib/schemas";

const editableFields = ["title", "time", "daysOfWeek", "enabled", "timezone"] as const;

export async function updateReminder(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    const parsed = updateReminderSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const existing = await readItem<ReminderDocument>(remindersContainer(), reminderId, userId);
    if (!existing || existing.isDeleted) return notFound("Reminder not found");

    const updated: ReminderDocument = { ...existing, updatedAt: new Date().toISOString() };
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(parsed.data, field)) {
        updated[field] = parsed.data[field] as never;
      }
    }

    await remindersContainer().item(reminderId, userId).replace(updated);

    return ok({ reminder: updated });
  } catch (error) {
    context.error("Update reminder failed", error);
    return serverError();
  }
}

app.http("updateReminder", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "reminders/{reminderId}",
  handler: updateReminder,
});
