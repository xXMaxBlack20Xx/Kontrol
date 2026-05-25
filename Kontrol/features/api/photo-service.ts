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

export function getPhoto(photoId: string): Promise<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }> {
  return apiGet<{ photo: PhotoMetadata; readUrl: string; expiresAt: string }>(`/photos/${encodeURIComponent(photoId)}`);
}

export function deletePhoto(photoId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/photos/${encodeURIComponent(photoId)}`);
}
