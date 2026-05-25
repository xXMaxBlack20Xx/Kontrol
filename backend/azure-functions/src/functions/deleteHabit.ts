import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";

export async function deleteHabit(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;

  try {
    userId = requireUser(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return unauthorized(error.message);
    }
    throw error;
  }

  try {
    const habitId = req.params.habitId;

    if (!habitId) {
      return badRequest("Missing habitId");
    }

    const existing = await readItem<HabitDocument>(habitsContainer(), habitId, userId);

    if (!existing || existing.isDeleted) {
      return notFound("Habit not found");
    }

    const updated: HabitDocument = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
      syncVersion: existing.syncVersion + 1,
    };

    await habitsContainer().item(habitId, userId).replace(updated);

    return ok({ success: true });
  } catch (error) {
    context.error("Delete habit failed", error);
    return serverError();
  }
}

app.http("deleteHabit", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "habits/{habitId}",
  handler: deleteHabit,
});
