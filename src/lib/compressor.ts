import { CompressionOptions } from '../types';
import { isHeicFile, convertHeicToStandard } from './converter';
import { getCleanMetaFilename } from './naming';

export interface CompressImageResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  outputSize: number;
  reductionPercentage: number;
  achievedTarget: boolean;
  message: string;
  filename: string;
}

/**
 * Compresses an image with presets or an iterative target size search
 */
export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<CompressImageResult> {
  let sourceBlob: Blob = file;

  if (isHeicFile(file)) {
    sourceBlob = await convertHeicToStandard(file);
  }

  const objectUrl = URL.createObjectURL(sourceBlob);
  const img = new Image();

  return new Promise((resolve, reject) => {
    let isSettled = false;
    const timeoutId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Compression timed out. Please try a smaller image or use Balanced preset.'));
      }
    }, 12000);

    const safeResolve = (res: CompressImageResult) => {
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

    img.onload = async () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      if (!origWidth || !origHeight) {
        URL.revokeObjectURL(objectUrl);
        safeReject(new Error('Invalid image dimensions.'));
        return;
      }

      // Determine output mime
      let outputMime = options.outputFormat;
      if (!outputMime) {
        const type = file.type.toLowerCase();
        if (type.includes('png')) outputMime = 'image/png';
        else if (type.includes('webp')) outputMime = 'image/webp';
        else outputMime = 'image/jpeg';
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        safeReject(new Error('Canvas context unavailable.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Helper to render and get blob
      const getBlobAt = (w: number, h: number, q: number): Promise<Blob> => {
        return new Promise((res, rej) => {
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          if (outputMime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error('Blob encoding failed'))),
            outputMime,
            outputMime === 'image/png' ? undefined : q
          );
        });
      };

      try {
        let bestBlob: Blob | null = null;
        let finalWidth = origWidth;
        let finalHeight = origHeight;
        let achievedTarget = true;
        let summaryMessage = '';

        if (options.mode === 'preset') {
          let quality = 0.85;
          let scale = 1.0;

          if (options.preset === 'high') {
            quality = 0.90;
            scale = 1.0;
          } else if (options.preset === 'balanced') {
            quality = 0.75;
            scale = 1.0;
          } else if (options.preset === 'small') {
            quality = 0.50;
            scale = 0.85; // Slight scale down to maximize compression
          }

          finalWidth = Math.max(1, Math.round(origWidth * scale));
          finalHeight = Math.max(1, Math.round(origHeight * scale));

          bestBlob = await getBlobAt(finalWidth, finalHeight, quality);
          summaryMessage = `Compressed using ${options.preset?.toUpperCase() || 'BALANCED'} preset.`;
        } else {
          // Fast target size search (max 3 quick attempts to prevent freezing)
          const targetBytes = (options.targetSizeKB || 500) * 1024;

          // Attempt 1: Standard high quality
          bestBlob = await getBlobAt(origWidth, origHeight, 0.75);

          // Attempt 2: If still too large, drop quality to 0.45
          if (bestBlob.size > targetBytes) {
            const pass2 = await getBlobAt(origWidth, origHeight, 0.45);
            bestBlob = pass2;
          }

          // Attempt 3: If still too large and resize allowed, scale down to 70%
          if (bestBlob.size > targetBytes && options.allowResize !== false) {
            finalWidth = Math.max(1, Math.round(origWidth * 0.70));
            finalHeight = Math.max(1, Math.round(origHeight * 0.70));
            const pass3 = await getBlobAt(finalWidth, finalHeight, 0.40);
            bestBlob = pass3;
          }

          if (bestBlob && bestBlob.size > targetBytes) {
            achievedTarget = false;
            summaryMessage = `Target of ${options.targetSizeKB} KB reached closest size of ${(bestBlob.size / 1024).toFixed(1)} KB.`;
          } else {
            achievedTarget = true;
            summaryMessage = `Successfully compressed under target size (${options.targetSizeKB} KB).`;
          }
        }

        URL.revokeObjectURL(objectUrl);

        if (!bestBlob) {
          throw new Error('Compression failed to produce output blob.');
        }

        const reduction = Math.max(0, Math.round(((file.size - bestBlob.size) / file.size) * 100));

        const filename = getCleanMetaFilename({
          mimeType: outputMime,
          index: options.index,
        });

        safeResolve({
          blob: bestBlob,
          width: finalWidth,
          height: finalHeight,
          originalSize: file.size,
          outputSize: bestBlob.size,
          reductionPercentage: reduction,
          achievedTarget,
          message: summaryMessage,
          filename,
        });
      } catch (err: any) {
        URL.revokeObjectURL(objectUrl);
        safeReject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      safeReject(new Error('Failed to load image for compression.'));
    };

    img.src = objectUrl;
  });
}
