import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer, readItem, remindersContainer } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, notFound, serverError, unauthorized } from "../lib/http";
import type { HabitDocument, ReminderDocument } from "../lib/models";
import { createReminderSchema } from "../lib/schemas";

export async function createReminder(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = createReminderSchema.safeParse(await req.json());

    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const habit = await readItem<HabitDocument>(habitsContainer(), parsed.data.habitId, userId);
    if (!habit || habit.isDeleted) return notFound("Habit not found");

    const now = new Date().toISOString();
    const reminder: ReminderDocument = {
      id: `reminder_${uuidv4()}`,
      userId,
      habitId: parsed.data.habitId,
      title: parsed.data.title,
      time: parsed.data.time,
      daysOfWeek: parsed.data.daysOfWeek,
      enabled: parsed.data.enabled,
      timezone: parsed.data.timezone,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await remindersContainer().items.create(reminder);
    context.log("Reminder created", { reminderId: reminder.id, userId });

    return created({ reminder });
  } catch (error) {
    context.error("Create reminder failed", error);
    return serverError();
  }
}

app.http("createReminder", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reminders",
  handler: createReminder,
});
