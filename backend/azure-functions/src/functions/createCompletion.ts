import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitCompletionsContainer, habitsContainer, readItem } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { HabitCompletionDocument, HabitDocument } from "../lib/models";
import { createCompletionSchema } from "../lib/schemas";

export async function createCompletion(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const parsed = createCompletionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    const habit = await readItem<HabitDocument>(habitsContainer(), parsed.data.habitId, userId);

    if (!habit || habit.isDeleted) {
      return notFound("Habit not found");
    }

    const now = new Date().toISOString();
    const completionId = `completion_${parsed.data.habitId}_${parsed.data.date}`;
    const existing = await readItem<HabitCompletionDocument>(habitCompletionsContainer(), completionId, userId);

    if (existing) {
      const completion: HabitCompletionDocument = {
        ...existing,
        completedAt: parsed.data.completedAt ?? existing.completedAt,
        updatedAt: now,
      };

      await habitCompletionsContainer().item(completionId, userId).replace(completion);
      return ok({ completion });
    }

    const completion: HabitCompletionDocument = {
      id: completionId,
      userId,
      habitId: parsed.data.habitId,
      date: parsed.data.date,
      completedAt: parsed.data.completedAt ?? now,
      source: "mobile",
      createdAt: now,
      updatedAt: now,
    };

    await habitCompletionsContainer().items.create(completion);

    return created({ completion });
  } catch (error) {
    context.error("Create completion failed", error);
    return serverError();
  }
}

app.http("createCompletion", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "completions",
  handler: createCompletion,
});
