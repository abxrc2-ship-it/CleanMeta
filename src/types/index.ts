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
  retentionPreference?: RetentionPreference;
  blobUrl?: string;
  historyRecordId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type CleanFormatPreference = 'auto' | 'jpeg' | 'png' | 'webp';

export type ToolType = 'metadata-remover' | 'converter' | 'compressor' | 'bg-remover';

export type RetentionPreference = 'none' | '1day' | '2days' | '3days' | '4days' | '7days' | 'permanent';

export interface HistoryRecord {
  id: string;
  userId: string;
  tool: ToolType;
  originalFileName: string;
  inputFormat: string;
  outputFormat: string;
  originalSize: number;
  processedSize: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: number;
  retention: RetentionPreference;
  blobUrl?: string;
  blobPathname?: string;
  expiresAt?: number;
}

export interface ConversionOptions {
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  backgroundColor?: string;
  resizeOption?: 'original' | 'scale75' | 'scale50' | 'custom';
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio?: boolean;
  quality?: number;
  index?: number;
}

export interface ConvertItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  dimensions?: { width: number; height: number };
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  status: 'queued' | 'converting' | 'converted' | 'error';
  errorMessage?: string;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFilename?: string;
  resultSize?: number;
}

export interface CompressionOptions {
  mode: 'preset' | 'target';
  preset?: 'high' | 'balanced' | 'small';
  targetSizeKB?: number;
  allowResize?: boolean;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  index?: number;
}

