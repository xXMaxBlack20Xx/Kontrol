import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";
import { updateHabitSchema } from "../lib/schemas";

const editableFields = ["name", "category", "frequency", "goal", "color", "icon", "isArchived"] as const;

export async function updateHabit(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    const parsed = updateHabitSchema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    const existing = await readItem<HabitDocument>(habitsContainer(), habitId, userId);

    if (!existing || existing.isDeleted) {
      return notFound("Habit not found");
    }

    const updated: HabitDocument = {
      ...existing,
      updatedAt: new Date().toISOString(),
      syncVersion: existing.syncVersion + 1,
    };

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(parsed.data, field)) {
        updated[field] = parsed.data[field] as never;
      }
    }

    await habitsContainer().item(habitId, userId).replace(updated);

    return ok({ habit: updated });
  } catch (error) {
    context.error("Update habit failed", error);
    return serverError();
  }
}

app.http("updateHabit", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "habits/{habitId}",
  handler: updateHabit,
});
