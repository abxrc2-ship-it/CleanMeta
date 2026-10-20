export interface TagDetail {
  name: string;
  value: string;
  category?: 'GPS' | 'Camera' | 'Date' | 'Software' | 'Image' | 'Other';
}

export interface DetectedMetadata {
  hasGps: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  dateTimeOriginal?: string;
  software?: string;
  iso?: string;
  fNumber?: string;
  exposureTime?: string;
  focalLength?: string;
  artistOrCopyright?: string;
  allTagsCount: number;
  tagList: TagDetail[];
}

export interface VerificationResult {
  verified: boolean;
  residualTagsCount: number;
  residualTags: string[];
  message: string;
  isGpsRemoved: boolean;
  isCameraRemoved: boolean;
  isExifRemoved: boolean;
}

export interface PhotoItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  originalUrl: string;
  dimensions?: { width: number; height: number };
  originalMetadata?: DetectedMetadata;
  status: 'queued' | 'reading_meta' | 'processing' | 'cleaned' | 'error';
  errorMessage?: string;
  cleanedBlob?: Blob;
  cleanedUrl?: string;
  cleanedSize?: number;
  cleanedDimensions?: { width: number; height: number };
  cleanedMetadataVerification?: VerificationResult;
  cleanedFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type CleanFormatPreference = 'auto' | 'jpeg' | 'png' | 'webp';
