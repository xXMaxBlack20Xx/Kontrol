import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { assertSafeUserBlobPath } from "../lib/blob";
import { habitsContainer, photosContainer, readItem } from "../lib/cosmos";
import { badRequest, created, isOptions, noContent, notFound, serverError, unauthorized } from "../lib/http";
import type { HabitDocument, PhotoDocument } from "../lib/models";
import { createPhotoMetadataSchema } from "../lib/schemas";

export async function createPhotoMetadata(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = createPhotoMetadataSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    try {
      assertSafeUserBlobPath(userId, parsed.data.blobPath);
    } catch {
      return badRequest("Invalid blobPath for authenticated user");
    }

    if (parsed.data.purpose === "profile") {
      if (!parsed.data.blobPath.startsWith(`${userId}/profile/`)) return badRequest("Invalid profile photo blobPath");
    } else {
      const habitId = parsed.data.habitId;
      if (!habitId) return badRequest("habitId is required for habit cover photos");

      if (!parsed.data.blobPath.startsWith(`${userId}/habits/${habitId}/`)) return badRequest("Invalid habit photo blobPath");

      const habit = await readItem<HabitDocument>(habitsContainer(), habitId, userId);
      if (!habit || habit.isDeleted) return notFound("Habit not found");
    }

    const now = new Date().toISOString();
    const photo: PhotoDocument = {
      id: parsed.data.photoId,
      userId,
      habitId: parsed.data.habitId ?? null,
      purpose: parsed.data.purpose,
      blobPath: parsed.data.blobPath,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await photosContainer().items.upsert(photo);

    return created({ photo });
  } catch (error) {
    context.error("Create photo metadata failed", error);
    return serverError();
  }
}

app.http("createPhotoMetadata", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "photos/metadata",
  handler: createPhotoMetadata,
});
