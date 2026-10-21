/**
 * CleanMeta standardized naming utility
 * Format requested by user:
 * CleanMeta_[DD]-[MM]-[YYYY]_[HH]-[mm]_[unique].[ext]
 * e.g. CleanMeta_21-10-2026_15-45_001.jpg
 */

export function getCleanMetaFilename(
  optionsOrOriginalName:
    | string
    | {
        mimeType?: string;
        originalName?: string;
        index?: number;
        useTimestamp?: boolean;
      },
  explicitExt?: string
): string {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  
  // User exact specification: Date first (DD), then Month (MM), then Year (YYYY), then Hour-Minute (HH-mm)
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  const hour = pad2(d.getHours());
  const minute = pad2(d.getMinutes());

  // Guarantee every single image has a distinct number/suffix so no numbers or names are identical
  const uniqueCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  if (typeof optionsOrOriginalName === 'string') {
    let ext = explicitExt || 'jpg';
    const dotIdx = optionsOrOriginalName.lastIndexOf('.');
    if (!explicitExt && dotIdx !== -1) {
      ext = optionsOrOriginalName.slice(dotIdx + 1).toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    }
    return `CleanMeta_${day}-${month}-${year}_${hour}-${minute}_${uniqueCode}.${ext}`;
  }

  const options = optionsOrOriginalName;
  let ext = 'jpg';
  if (options.mimeType) {
    if (options.mimeType.includes('png')) ext = 'png';
    else if (options.mimeType.includes('webp')) ext = 'webp';
    else if (options.mimeType.includes('pdf')) ext = 'pdf';
    else if (options.mimeType.includes('jpeg') || options.mimeType.includes('jpg')) ext = 'jpg';
  } else if (options.originalName) {
    const dotIdx = options.originalName.lastIndexOf('.');
    if (dotIdx !== -1) {
      ext = options.originalName.slice(dotIdx + 1).toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    }
  }

  const serialNum = options.index !== undefined ? String(options.index + 1).padStart(3, '0') : '001';
  return `CleanMeta_${day}-${month}-${year}_${hour}-${minute}_${serialNum}-${uniqueCode}.${ext}`;
}
