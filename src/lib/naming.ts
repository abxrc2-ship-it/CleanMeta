/**
 * CleanMeta standardized naming utility
 * Format requested by user:
 * cleanmeta-YYYY-MM-DD-001.ext or cleanmeta-YYYY-MM-DD-HHmmss.ext
 */

export function getCleanMetaFilename(options: {
  mimeType?: string;
  originalName?: string;
  index?: number;
  useTimestamp?: boolean;
}): string {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  let ext = 'jpg';
  if (options.mimeType) {
    if (options.mimeType.includes('png')) ext = 'png';
    else if (options.mimeType.includes('webp')) ext = 'webp';
    else if (options.mimeType.includes('jpeg') || options.mimeType.includes('jpg')) ext = 'jpg';
  } else if (options.originalName) {
    const dotIdx = options.originalName.lastIndexOf('.');
    if (dotIdx !== -1) {
      ext = options.originalName.slice(dotIdx + 1).toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    }
  }

  if (options.index !== undefined && !options.useTimestamp) {
    const serial = String(options.index + 1).padStart(3, '0');
    return `cleanmeta-${dateStr}-${serial}.${ext}`;
  }

  const timeStr = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  if (options.index !== undefined) {
    const serial = String(options.index + 1).padStart(3, '0');
    return `cleanmeta-${dateStr}-${timeStr}-${serial}.${ext}`;
  }

  return `cleanmeta-${dateStr}-${timeStr}.${ext}`;
}
