import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { AuthenticationError, requireUser } from "../lib/auth";
import { generatePhotoUploadUrl } from "../lib/blob";
import { habitsContainer, readItem } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, notFound, serverError, unauthorized } from "../lib/http";
import type { HabitDocument } from "../lib/models";
import { createPhotoUploadUrlSchema } from "../lib/schemas";

export async function createPhotoUploadUrl(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = createPhotoUploadUrlSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const photoId = `photo_${uuidv4()}`;
    const extension = parsed.data.fileExtension === "jpeg" ? "jpg" : parsed.data.fileExtension;

    let blobPath: string;
    if (parsed.data.purpose === "profile") {
      blobPath = `${userId}/profile/${photoId}.${extension}`;
    } else {
      const habitId = parsed.data.habitId;
      if (!habitId) return badRequest("habitId is required for habit cover photos");

      const habit = await readItem<HabitDocument>(habitsContainer(), habitId, userId);
      if (!habit || habit.isDeleted) return notFound("Habit not found");

      blobPath = `${userId}/habits/${habitId}/${photoId}.${extension}`;
    }

    const upload = await generatePhotoUploadUrl(blobPath);

    return created({ photoId, blobPath, ...upload });
  } catch (error) {
    context.error("Create photo upload URL failed", error);
    return serverError();
  }
}

app.http("createPhotoUploadUrl", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "photos/upload-url",
  handler: createPhotoUploadUrl,
});
