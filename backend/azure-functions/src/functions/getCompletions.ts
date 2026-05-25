import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitCompletionsContainer, queryItems } from "../lib/cosmos";
import { badRequest, isOptions, noContent, ok, serverError, unauthorized } from "../lib/http";
import type { HabitCompletionDocument } from "../lib/models";
import { completionQuerySchema } from "../lib/schemas";

export async function getCompletions(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const parsed = completionQuerySchema.safeParse(Object.fromEntries(req.query.entries()));

    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const filters = ["c.userId = @userId"];
    const parameters: { name: string; value: string | number | boolean | null }[] = [{ name: "@userId", value: userId }];

    if (parsed.data.habitId) {
      filters.push("c.habitId = @habitId");
      parameters.push({ name: "@habitId", value: parsed.data.habitId });
    }

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
      `SELECT * FROM c WHERE ${filters.join(" AND ")} ORDER BY c.date DESC`,
      parameters,
      userId,
    );

    return ok({ completions });
  } catch (error) {
    context.error("Get completions failed", error);
    return serverError();
  }
}

app.http("getCompletions", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "completions",
  handler: getCompletions,
});
