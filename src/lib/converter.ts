import { ConversionOptions } from '../types';
import { getCleanMetaFilename } from './naming';

export interface ConvertImageResult {
  blob: Blob;
  width: number;
  height: number;
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  filename: string;
}

/**
 * Checks if a file is an iPhone HEIC/HEIF image
 */
export function isHeicFile(file: File | Blob): boolean {
  const type = file.type?.toLowerCase() || '';
  if (type.includes('heic') || type.includes('heif')) return true;
  if ('name' in file && typeof file.name === 'string') {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
  }
  return false;
}

/**
 * Converts a HEIC/HEIF blob to a standard PNG/JPEG blob using heic2any
 */
export async function convertHeicToStandard(file: File | Blob): Promise<Blob> {
  const heic2anyModule = await import('heic2any');
  const heic2any = heic2anyModule.default || heic2anyModule;
  const result = await heic2any({
    blob: file,
    toType: 'image/png',
    quality: 0.95,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Converts an image file to target format with optional background filling and resizing
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConvertImageResult> {
  let sourceBlob: Blob = file;

  // Handle HEIC/HEIF conversion first if detected
  if (isHeicFile(file)) {
    try {
      sourceBlob = await convertHeicToStandard(file);
    } catch (err: any) {
      throw new Error(`HEIC decoding failed: ${err.message || 'Unsupported HEIC container'}`);
    }
  }

  const objectUrl = URL.createObjectURL(sourceBlob);
  const img = new Image();

  return new Promise((resolve, reject) => {
    let isSettled = false;
    const timeoutId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Conversion timed out. Please try a smaller image.'));
      }
    }, 12000);

    const safeResolve = (res: ConvertImageResult) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutId);
        resolve(res);
      }
    };

    const safeReject = (err: Error) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutId);
        reject(err);
      }
    };

    img.onload = () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      if (!origWidth || !origHeight) {
        URL.revokeObjectURL(objectUrl);
        safeReject(new Error('Invalid image dimensions.'));
        return;
      }

      // Calculate target dimensions
      let targetWidth = origWidth;
      let targetHeight = origHeight;

      if (options.resizeOption === 'scale75') {
        targetWidth = Math.max(1, Math.round(origWidth * 0.75));
        targetHeight = Math.max(1, Math.round(origHeight * 0.75));
      } else if (options.resizeOption === 'scale50') {
        targetWidth = Math.max(1, Math.round(origWidth * 0.5));
        targetHeight = Math.max(1, Math.round(origHeight * 0.5));
      } else if (options.resizeOption === 'custom' && options.customWidth && options.customHeight) {
        targetWidth = Math.max(1, options.customWidth);
        targetHeight = Math.max(1, options.customHeight);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: true });

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not acquire 2D canvas context.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If converting to JPEG, JPEG does not support transparency!
      // Fill background color (default white #ffffff)
      if (options.targetFormat === 'image/jpeg') {
        ctx.fillStyle = options.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(objectUrl);

      const quality = options.targetFormat === 'image/png' ? undefined : (options.quality || 0.95);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            safeReject(new Error('Failed to encode image to blob.'));
            return;
          }

          const filename = getCleanMetaFilename({
            mimeType: options.targetFormat,
            index: options.index,
          });

          safeResolve({
            blob,
            width: targetWidth,
            height: targetHeight,
            outputFormat: options.targetFormat,
            filename,
          });
        },
        options.targetFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      safeReject(new Error('Could not decode image for conversion. File may be corrupted or unsupported.'));
    };

    img.src = objectUrl;
  });
}
