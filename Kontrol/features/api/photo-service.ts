import { apiDelete, apiGet, apiPost } from './api';

export type PhotoUploadUrlResponse = {
  uploadUrl: string;
  blobPath: string;
  photoId: string;
  expiresAt: string;
};

export type PhotoMetadata = {
  id: string;
  userId: string;
  habitId: string;
  blobPath: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export function createPhotoUploadUrl(input: {
  habitId: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileExtension: 'jpg' | 'jpeg' | 'png' | 'webp';
}): Promise<PhotoUploadUrlResponse> {
  return apiPost<PhotoUploadUrlResponse>('/photos/upload-url', input);
}

export function createPhotoMetadata(input: {
  photoId: string;
  habitId: string;
  blobPath: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}): Promise<{ photo: PhotoMetadata }> {
  return apiPost<{ photo: PhotoMetadata }>('/photos/metadata', input);
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

export function getPhoto(photoId: string): Promise<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }> {
  return apiGet<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }>(`/photos/${encodeURIComponent(photoId)}`);
}

export function deletePhoto(photoId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/photos/${encodeURIComponent(photoId)}`);
}
