import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { photosContainer, readItem, usersContainer } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { PhotoDocument, UserDocument } from "../lib/models";
import { toPublicUser } from "../lib/models";
import { updateProfilePhotoSchema } from "../lib/schemas";

export async function updateProfilePhoto(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const parsed = updateProfilePhotoSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

    const user = await readItem<UserDocument>(usersContainer(), userId, userId);
    if (!user) return notFound("User not found");

    if (parsed.data.photoId) {
      const photo = await readItem<PhotoDocument>(photosContainer(), parsed.data.photoId, userId);
      if (!photo || photo.isDeleted) return notFound("Photo not found");
      if (photo.purpose !== "profile") return badRequest("Photo is not a profile photo");
      if (!photo.blobPath.startsWith(`${userId}/profile/`)) return badRequest("Invalid profile photo blobPath");
    }

    const nextUser: UserDocument = {
      ...user,
      profilePhotoId: parsed.data.photoId,
      updatedAt: new Date().toISOString(),
    };

    await usersContainer().item(userId, userId).replace(nextUser);

    return ok({ user: toPublicUser(nextUser) });
  } catch (error) {
    context.error("Update profile photo failed", error);
    return serverError();
  }
}

app.http("updateProfilePhoto", {
  methods: ["PUT", "OPTIONS"],
  authLevel: "anonymous",
  route: "me/profile-photo",
  handler: updateProfilePhoto,
});
