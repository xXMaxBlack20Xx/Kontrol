import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { habitCompletionsContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { HabitCompletionDocument } from "../lib/models";

export async function deleteCompletion(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const completionId = req.params.completionId;

    if (!completionId) {
      return badRequest("Missing completionId");
    }

    const existing = await readItem<HabitCompletionDocument>(habitCompletionsContainer(), completionId, userId);

    if (!existing) {
      return notFound("Completion not found");
    }

    await habitCompletionsContainer().item(completionId, userId).delete();

    return ok({ success: true });
  } catch (error) {
    context.error("Delete completion failed", error);
    return serverError();
  }
}

app.http("deleteCompletion", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "completions/{completionId}",
  handler: deleteCompletion,
});
