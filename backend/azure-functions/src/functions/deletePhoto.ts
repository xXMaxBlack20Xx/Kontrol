import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AuthenticationError, requireUser } from "../lib/auth";
import { deletePhotoBlobIfConfigured } from "../lib/blob";
import { photosContainer, readItem } from "../lib/cosmos";
import { badRequest, isOptions, noContent, notFound, ok, serverError, unauthorized } from "../lib/http";
import type { PhotoDocument } from "../lib/models";

export async function deletePhoto(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    await photosContainer().item(photoId, userId).replace({
      ...photo,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    });

    try {
      await deletePhotoBlobIfConfigured(photo.blobPath);
    } catch (error) {
      context.log("Photo blob physical delete skipped or failed", { photoId, error: error instanceof Error ? error.message : "unknown" });
    }

    return ok({ success: true });
  } catch (error) {
    context.error("Delete photo failed", error);
    return serverError();
  }
}

app.http("deletePhoto", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "photos/{photoId}",
  handler: deletePhoto,
});
