import JSZip from 'jszip';
import { PhotoItem } from '../types';
import { getSafeCleanFilename } from './imageProcessor';

/**
 * Packs all cleaned photos into a ZIP archive and triggers browser download.
 */
export async function downloadCleanPhotosAsZip(
  photos: PhotoItem[],
  onProgress?: (percent: number) => void
): Promise<void> {
  const cleanedPhotos = photos.filter((p) => p.status === 'cleaned' && p.cleanedBlob);

  if (cleanedPhotos.length === 0) {
    throw new Error('No cleaned photos available to download.');
  }

  const zip = new JSZip();
  const folder = zip.folder('cleanmeta-photos');

  // Avoid duplicate names in the ZIP archive
  const usedNames = new Set<string>();

    for (let i = 0; i < cleanedPhotos.length; i++) {
    const photo = cleanedPhotos[i];
    const mime = photo.cleanedFormat || photo.type || 'image/jpeg';
    let filename = getSafeCleanFilename(photo.name, mime, i);

    // Ensure distinct names
    let counter = 1;
    while (usedNames.has(filename)) {
      const dotIdx = filename.lastIndexOf('.');
      const namePart = dotIdx !== -1 ? filename.slice(0, dotIdx) : filename;
      const extPart = dotIdx !== -1 ? filename.slice(dotIdx) : '';
      filename = `${namePart}_${counter}${extPart}`;
      counter++;
    }
    usedNames.add(filename);

    if (photo.cleanedBlob && folder) {
      folder.file(filename, photo.cleanedBlob);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / cleanedPhotos.length) * 50));
    }
  }

  // Generate the zip blob
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent * 0.5));
      }
    }
  );

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFilename = `CleanMeta_Photos_${dateStr}.zip`;

  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke object url after download triggers
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 2000);
}

/**
 * Downloads a single cleaned photo blob with safe naming.
 */
export function downloadSinglePhoto(photo: PhotoItem): void {
  if (!photo.cleanedBlob) return;

  const mime = photo.cleanedFormat || photo.type || 'image/jpeg';
  const filename = getSafeCleanFilename(photo.name, mime);

  const downloadUrl = URL.createObjectURL(photo.cleanedBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 2000);
}
