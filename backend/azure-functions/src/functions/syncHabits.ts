import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer, queryItems, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";
import { syncHabitsSchema } from "../lib/schemas";

export async function syncHabits(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const parsed = syncHabitsSchema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    const container = habitsContainer();

    for (const clientHabit of parsed.data.habits) {
      const existing = await readItem<HabitDocument>(container, clientHabit.id, userId);

      if (!existing) {
        const habit: HabitDocument = {
          id: clientHabit.id,
          userId,
          name: clientHabit.name,
          category: clientHabit.category ?? null,
          frequency: clientHabit.frequency,
          goal: clientHabit.goal ?? null,
          color: clientHabit.color ?? null,
          icon: clientHabit.icon ?? null,
          isArchived: clientHabit.isArchived,
          isDeleted: clientHabit.isDeleted,
          syncVersion: clientHabit.syncVersion,
          createdAt: clientHabit.createdAt ?? clientHabit.updatedAt,
          updatedAt: clientHabit.updatedAt,
        };

        await container.items.create(habit);
        continue;
      }

      if (Date.parse(clientHabit.updatedAt) > Date.parse(existing.updatedAt)) {
        const habit: HabitDocument = {
          ...existing,
          name: clientHabit.name,
          category: clientHabit.category ?? null,
          frequency: clientHabit.frequency,
          goal: clientHabit.goal ?? null,
          color: clientHabit.color ?? null,
          icon: clientHabit.icon ?? null,
          isArchived: clientHabit.isArchived,
          isDeleted: clientHabit.isDeleted,
          syncVersion: Math.max(clientHabit.syncVersion, existing.syncVersion + 1),
          updatedAt: clientHabit.updatedAt,
        };

        await container.item(existing.id, userId).replace(habit);
      }
    }

    const habits = await queryItems<HabitDocument>(
      container,
      "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      [{ name: "@userId", value: userId }],
      userId,
    );

    return ok({
      serverTime: new Date().toISOString(),
      habits,
    });
  } catch (error) {
    context.error("Sync habits failed", error);
    return serverError();
  }
}

app.http("syncHabits", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "sync/habits",
  handler: syncHabits,
});
