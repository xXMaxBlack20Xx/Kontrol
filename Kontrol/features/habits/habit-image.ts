import * as ImagePicker from 'expo-image-picker';

import {
  type PhotoMetadata,
  uploadPhotoAsset,
} from '@/features/api/photo-service';

export type ImageContentType = PhotoMetadata['contentType'];
export type ImageExtension = 'jpg' | 'jpeg' | 'png' | 'webp';

export type SelectedHabitImage = {
  contentType: ImageContentType;
  fileExtension: ImageExtension;
  sizeBytes?: number;
  uri: string;
};

export const maxHabitImageSizeBytes = 10_000_000;

export function getHabitImageType(
  asset: ImagePicker.ImagePickerAsset,
): { contentType: ImageContentType; fileExtension: ImageExtension } | null {
  const mimeType = asset.mimeType?.toLowerCase();
  const uri = asset.uri.toLowerCase();

  if (mimeType === 'image/jpeg' || uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
    return { contentType: 'image/jpeg', fileExtension: uri.endsWith('.jpeg') ? 'jpeg' : 'jpg' };
  }

  if (mimeType === 'image/png' || uri.endsWith('.png')) {
    return { contentType: 'image/png', fileExtension: 'png' };
  }

  if (mimeType === 'image/webp' || uri.endsWith('.webp')) {
    return { contentType: 'image/webp', fileExtension: 'webp' };
  }

  return null;
}

export async function uploadHabitImage(habitId: string, selectedImage: SelectedHabitImage): Promise<string> {
  return uploadPhotoAsset({
    contentType: selectedImage.contentType,
    fileExtension: selectedImage.fileExtension,
    habitId,
    sizeBytes: selectedImage.sizeBytes,
    uri: selectedImage.uri,
  });
}
