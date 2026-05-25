import { ApiError, apiPut } from '@/features/api/api';
import {
  PhotoUploadFlowError,
  type PhotoUploadStage,
  type PhotoMetadata,
  uploadPhotoAsset,
} from '@/features/api/photo-service';

import type { ApiUser } from './auth-service';

export type ProfilePhotoUploadPhase = 'uploading' | 'saving';
export type ProfilePhotoStage = PhotoUploadStage | 'update-profile-photo';

export type SelectedProfilePhoto = {
  contentType: PhotoMetadata['contentType'];
  fileExtension: 'jpg' | 'jpeg' | 'png' | 'webp';
  sizeBytes?: number;
  uri: string;
};

export class ProfilePhotoError extends Error {
  cause: unknown;
  stage: ProfilePhotoStage;

  constructor(stage: ProfilePhotoStage, cause: unknown) {
    super(`PROFILE_PHOTO_${stage.toUpperCase().replace(/-/g, '_')}_FAILED`);
    this.name = 'ProfilePhotoError';
    this.stage = stage;
    this.cause = cause;
  }
}

function logProfilePhotoError(error: ProfilePhotoError): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const cause = error.cause instanceof PhotoUploadFlowError ? error.cause.cause : error.cause;
  const details = cause instanceof ApiError
    ? { code: cause.code, message: cause.message, stage: error.stage, status: cause.status }
    : { message: cause instanceof Error ? cause.message : 'Unknown error', stage: error.stage };

  console.warn('[profile-photo]', details);
}

export async function updateProfilePhoto(photoId: string | null): Promise<ApiUser> {
  const response = await apiPut<{ user: ApiUser }>('/me/profile-photo', { photoId });

  return response.user;
}

export async function uploadProfilePhoto(
  selectedPhoto: SelectedProfilePhoto,
  onPhase?: (phase: ProfilePhotoUploadPhase) => void,
): Promise<ApiUser> {
  onPhase?.('uploading');

  let photoId: string;
  try {
    photoId = await uploadPhotoAsset({
      contentType: selectedPhoto.contentType,
      fileExtension: selectedPhoto.fileExtension,
      purpose: 'profile',
      sizeBytes: selectedPhoto.sizeBytes,
      uri: selectedPhoto.uri,
    });
  } catch (error) {
    const wrapped = error instanceof PhotoUploadFlowError
      ? new ProfilePhotoError(error.stage, error)
      : new ProfilePhotoError('upload-blob', error);
    logProfilePhotoError(wrapped);
    throw wrapped;
  }

  onPhase?.('saving');

  try {
    return await updateProfilePhoto(photoId);
  } catch (error) {
    const wrapped = new ProfilePhotoError('update-profile-photo', error);
    logProfilePhotoError(wrapped);
    throw wrapped;
  }
}

export function removeProfilePhoto(): Promise<ApiUser> {
  return updateProfilePhoto(null);
}
