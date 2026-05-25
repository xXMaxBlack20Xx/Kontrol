import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { generatePhotoReadUrl } from "../lib/blob";
import { photosContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { PhotoDocument } from "../lib/models";

export async function getPhoto(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (isOptions(req)) return noContent(req);

  let userId: string;
  try {
    userId = requireUser(req);
  } catch (error) {
    return error instanceof AuthenticationError ? unauthorized(error.message) : serverError();
  }

  try {
    const photoId = req.params.photoId;
    if (!photoId) return badRequest("Missing photoId");

    const photo = await readItem<PhotoDocument>(photosContainer(), photoId, userId);
    if (!photo || photo.isDeleted) return notFound("Photo not found");

    const read = await generatePhotoReadUrl(photo.blobPath);

    return ok({ photo, ...read });
  } catch (error) {
    context.error("Get photo failed", error);
    return serverError();
  }
}

app.http("getPhoto", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "photos/{photoId}",
  handler: getPhoto,
});
