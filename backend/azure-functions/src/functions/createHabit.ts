import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";
import { createHabitSchema } from "../lib/schemas";

export async function createHabit(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const parsed = createHabitSchema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    const now = new Date().toISOString();
    const habit: HabitDocument = {
      id: `habit_${uuidv4()}`,
      userId,
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      subcategories: parsed.data.subcategories ?? [],
      frequency: parsed.data.frequency,
      daysOfWeek: parsed.data.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
      goal: parsed.data.goal ?? null,
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      coverPhotoId: null,
      isArchived: false,
      isDeleted: false,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await habitsContainer().items.create(habit);

    return created({ habit });
  } catch (error) {
    context.error("Create habit failed", error);
    return serverError();
  }
}

app.http("createHabit", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "habits",
  handler: createHabit,
});
