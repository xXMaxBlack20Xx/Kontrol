import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitCompletionsContainer, habitsContainer, queryItems } from "../lib/cosmos";
import { badRequest, isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { HabitCompletionDocument, HabitDocument } from "../lib/models";
import { progressQuerySchema } from "../lib/schemas";

export async function getProgress(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const parsed = progressQuerySchema.safeParse(Object.fromEntries(req.query.entries()));

    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const habits = await queryItems<HabitDocument>(
      habitsContainer(),
      "SELECT * FROM c WHERE c.userId = @userId AND c.isDeleted = false",
      [{ name: "@userId", value: userId }],
      userId,
    );

    const filters = ["c.userId = @userId"];
    const parameters: { name: string; value: string | number | boolean | null }[] = [{ name: "@userId", value: userId }];

    if (parsed.data.from) {
      filters.push("c.date >= @from");
      parameters.push({ name: "@from", value: parsed.data.from });
    }

    if (parsed.data.to) {
      filters.push("c.date <= @to");
      parameters.push({ name: "@to", value: parsed.data.to });
    }

    const completions = await queryItems<HabitCompletionDocument>(
      habitCompletionsContainer(),
      `SELECT * FROM c WHERE ${filters.join(" AND ")}`,
      parameters,
      userId,
    );

    const today = new Date().toISOString().slice(0, 10);
    const activeHabits = habits.filter((habit) => !habit.isArchived).length;
    const completedToday = new Set(
      completions.filter((completion) => completion.date === today).map((completion) => completion.habitId),
    ).size;

    return ok({
      progress: {
        totalHabits: habits.length,
        activeHabits,
        totalCompletions: completions.length,
        completedToday,
        completionRate: activeHabits === 0 ? 0 : Math.min(completedToday / activeHabits, 1),
      },
    });
  } catch (error) {
    context.error("Get progress failed", error);
    return serverError();
  }
}

app.http("getProgress", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "progress",
  handler: getProgress,
});
