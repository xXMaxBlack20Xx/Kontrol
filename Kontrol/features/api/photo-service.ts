import { apiDelete, apiGet, apiPost } from './api';

export type PhotoPurpose = 'habit-cover' | 'profile';
export type PhotoUploadStage = 'create-upload-url' | 'upload-blob' | 'create-metadata';

export type PhotoUploadUrlResponse = {
  uploadUrl: string;
  blobPath: string;
  photoId: string;
  expiresAt: string;
};

export type PhotoMetadata = {
  id: string;
  userId: string;
  habitId?: string | null;
  purpose?: PhotoPurpose;
  blobPath: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export function createPhotoUploadUrl(input: {
  habitId?: string;
  purpose?: PhotoPurpose;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileExtension: 'jpg' | 'jpeg' | 'png' | 'webp';
}): Promise<PhotoUploadUrlResponse> {
  return apiPost<PhotoUploadUrlResponse>('/photos/upload-url', input);
}

export function createPhotoMetadata(input: {
  photoId: string;
  habitId?: string;
  purpose?: PhotoPurpose;
  blobPath: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}): Promise<{ photo: PhotoMetadata }> {
  return apiPost<{ photo: PhotoMetadata }>('/photos/metadata', input);
}

export class PhotoUploadFlowError extends Error {
  cause: unknown;
  stage: PhotoUploadStage;

  constructor(stage: PhotoUploadStage, cause: unknown) {
    super(`PHOTO_UPLOAD_${stage.toUpperCase().replace(/-/g, '_')}_FAILED`);
    this.name = 'PhotoUploadFlowError';
    this.stage = stage;
    this.cause = cause;
  }
}

export async function uploadPhotoBlob(input: {
  uploadUrl: string;
  uri: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}): Promise<number> {
  const fileResponse = await fetch(input.uri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(input.uploadUrl, {
    body: blob,
    headers: {
      'Content-Type': input.contentType,
      'x-ms-blob-type': 'BlockBlob',
    },
    method: 'PUT',
  });

  if (!uploadResponse.ok) {
    throw new Error('PHOTO_UPLOAD_FAILED');
  }

  return blob.size;
}

export async function uploadPhotoAsset(input: {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileExtension: 'jpg' | 'jpeg' | 'png' | 'webp';
  habitId?: string;
  purpose?: PhotoPurpose;
  sizeBytes?: number;
  uri: string;
}): Promise<string> {
  const purpose = input.purpose ?? 'habit-cover';
  let upload: PhotoUploadUrlResponse;

  try {
    upload = await createPhotoUploadUrl(
      purpose === 'profile'
        ? {
            contentType: input.contentType,
            fileExtension: input.fileExtension,
            purpose,
          }
        : {
            contentType: input.contentType,
            fileExtension: input.fileExtension,
            habitId: input.habitId,
          },
    );
  } catch (error) {
    throw new PhotoUploadFlowError('create-upload-url', error);
  }

  let uploadedSizeBytes: number;

  try {
    uploadedSizeBytes = await uploadPhotoBlob({
      contentType: input.contentType,
      uploadUrl: upload.uploadUrl,
      uri: input.uri,
    });
  } catch (error) {
    throw new PhotoUploadFlowError('upload-blob', error);
  }

  const sizeBytes = input.sizeBytes && input.sizeBytes > 0 ? input.sizeBytes : uploadedSizeBytes;

  try {
    await createPhotoMetadata(
      purpose === 'profile'
        ? {
            blobPath: upload.blobPath,
            contentType: input.contentType,
            photoId: upload.photoId,
            purpose,
            sizeBytes,
          }
        : {
            blobPath: upload.blobPath,
            contentType: input.contentType,
            habitId: input.habitId,
            photoId: upload.photoId,
            sizeBytes,
          },
    );
  } catch (error) {
    throw new PhotoUploadFlowError('create-metadata', error);
  }

  return upload.photoId;
}

export function getPhoto(photoId: string): Promise<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }> {
  return apiGet<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }>(`/photos/${encodeURIComponent(photoId)}`);
}

export function deletePhoto(photoId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/photos/${encodeURIComponent(photoId)}`);
}
