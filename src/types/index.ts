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
  dateTime?: string;
  software?: string;
  iso?: string;
  fNumber?: string;
  aperture?: string;
  exposureTime?: string;
  shutterSpeed?: string;
  focalLength?: string;
  artistOrCopyright?: string;
  isAiGenerated?: boolean;
  aiToolOrSoftware?: string;
  aiPromptSnippet?: string;
  isDigitalGraphic?: boolean;
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

// All 7 Image Tools
export type ImageToolType =
  | 'metadata-remover'
  | 'metadata-editor'
  | 'metadata-viewer'
  | 'converter'
  | 'compressor'
  | 'image-compare'
  | 'image-resizer';

// All 14 PDF Tools
export type PdfToolType =
  | 'pdf-viewer'
  | 'pdf-split'
  | 'pdf-to-image'
  | 'pdf-editor'
  | 'pdf-merge'
  | 'pdf-compress'
  | 'pdf-organize'
  | 'images-to-pdf'
  | 'pdf-sign'
  | 'pdf-ocr'
  | 'pdf-protect'
  | 'pdf-parser'
  | 'pdf-asset-remover'
  | 'pdf-compare';

// All 2 File Tools
export type FileToolType = 'file-asset-extract' | 'file-compare';

// 3 Video Tools (Coming Soon)
export type VideoToolType = 'video-editor' | 'video-compare' | 'video-streams';

export type ToolType = ImageToolType | PdfToolType | FileToolType | VideoToolType;

export type NavigationTab =
  | 'home'
  | 'all-tools'
  | 'image-tools'
  | 'pdf-tools'
  | 'file-tools'
  | 'video-tools'
  | 'my-files'
  | 'history'
  | 'favorites'
  | 'pricing'
  | 'help'
  | 'about'
  | 'settings'
  | 'admin'
  | ToolType;

export type RetentionPreference =
  | 'none'
  | '3hours'
  | '6hours'
  | '12hours'
  | '24hours'
  | '48hours'
  | '1day'
  | '2days';

export interface HistoryRecord {
  id: string;
  userId: string;
  tool: string;
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

export interface StoredFileItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: number;
  expiresAt?: number;
  sourceTool: string;
  isLocalOnly: boolean;
  blob?: Blob;
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

export interface ResizeOptions {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  fitMode: 'contain' | 'cover' | 'fill';
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  backgroundColor: string;
}

export interface ToolDefinition {
  id: ToolType;
  title: string;
  category: 'image' | 'pdf' | 'file' | 'video';
  description: string;
  icon: string;
  badge?: string;
  isComingSoon?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
}
