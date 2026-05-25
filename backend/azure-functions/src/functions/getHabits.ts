import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitsContainer, queryItems } from "../lib/cosmos";
import { isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";

export async function getHabits(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const habits = await queryItems<HabitDocument>(
      habitsContainer(),
      "SELECT * FROM c WHERE c.userId = @userId AND c.isDeleted = false ORDER BY c.updatedAt DESC",
      [{ name: "@userId", value: userId }],
      userId,
    );

    return ok({ habits });
  } catch (error) {
    context.error("Get habits failed", error);
    return serverError();
  }
}

app.http("getHabits", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "habits",
  handler: getHabits,
});
