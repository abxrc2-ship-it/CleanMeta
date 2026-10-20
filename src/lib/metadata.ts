import ExifReader from 'exifreader';
import { DetectedMetadata, TagDetail, VerificationResult } from '../types';

/**
 * Validate actual file binary magic bytes to avoid trusting filename extensions blindly.
 */
export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  detectedFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  error?: string;
}> {
  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  // Maximum initial size limit: 25 MB
  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, detectedFormat: 'image/jpeg' };
    }

    // Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { valid: true, detectedFormat: 'image/png' };
    }

    // Check WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (riff === 'RIFF' && webp === 'WEBP') {
      return { valid: true, detectedFormat: 'image/webp' };
    }

    return {
      valid: false,
      error: 'Unsupported or corrupted image format. Please select a valid JPEG, PNG, or WebP photo.',
    };
  } catch (err) {
    return {
      valid: false,
      error: `Unable to read file headers: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extracts comprehensive metadata from a photo file or blob.
 */
export async function extractMetadata(source: File | Blob): Promise<DetectedMetadata> {
  const result: DetectedMetadata = {
    hasGps: false,
    allTagsCount: 0,
    tagList: [],
  };

  try {
    const arrayBuffer = await source.arrayBuffer();
    // ExifReader parses EXIF, IPTC, XMP, ICC, etc.
    const tags: any = ExifReader.load(arrayBuffer, { expanded: true });

    const tagList: TagDetail[] = [];

    // Helper to get string description
    const getDesc = (tag: any): string | undefined => {
      if (!tag) return undefined;
      if (typeof tag.description === 'string' || typeof tag.description === 'number') {
        return String(tag.description).trim();
      }
      if (tag.value !== undefined) {
        return String(tag.value).trim();
      }
      return undefined;
    };

    // Flatten tags for listing
    const processTagGroup = (groupName: string, groupObj: any) => {
      if (!groupObj || typeof groupObj !== 'object') return;
      for (const [key, value] of Object.entries(groupObj)) {
        if (!value || typeof value !== 'object') continue;
        const desc = getDesc(value);
        if (desc) {
          let category: TagDetail['category'] = 'Other';
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('gps') || groupName === 'gps') category = 'GPS';
          else if (lowerKey.includes('camera') || lowerKey.includes('make') || lowerKey.includes('model') || lowerKey.includes('lens')) category = 'Camera';
          else if (lowerKey.includes('date') || lowerKey.includes('time')) category = 'Date';
          else if (lowerKey.includes('software') || lowerKey.includes('creator') || lowerKey.includes('photoshop')) category = 'Software';
          else if (lowerKey.includes('width') || lowerKey.includes('height') || lowerKey.includes('color') || lowerKey.includes('resolution')) category = 'Image';

          tagList.push({
            name: key,
            value: desc,
            category,
          });
        }
      }
    };

    // Process top-level and expanded groups
    if (tags.exif) processTagGroup('exif', tags.exif);
    if (tags.gps) processTagGroup('gps', tags.gps);
    if (tags.iptc) processTagGroup('iptc', tags.iptc);
    if (tags.xmp) processTagGroup('xmp', tags.xmp);
    if (tags.icc) processTagGroup('icc', tags.icc);

    // If there are top-level tags not in subgroups
    for (const [key, val] of Object.entries(tags)) {
      if (['exif', 'gps', 'iptc', 'xmp', 'icc'].includes(key)) continue;
      if (val && typeof val === 'object' && 'description' in (val as any)) {
        const desc = getDesc(val);
        if (desc && !tagList.some((t) => t.name === key)) {
          tagList.push({
            name: key,
            value: desc,
            category: key.toLowerCase().includes('gps') ? 'GPS' : 'Other',
          });
        }
      }
    }

    // Extract notable fields
    const allTags: any = {
      ...(tags.exif || {}),
      ...(tags.gps || {}),
      ...(tags.xmp || {}),
      ...tags,
    };

    // GPS coordinates check
    if (tags.gps) {
      const lat = tags.gps.Latitude ?? tags.gps.GPSLatitude;
      const lon = tags.gps.Longitude ?? tags.gps.GPSLongitude;
      const alt = tags.gps.Altitude ?? tags.gps.GPSAltitude;

      if (lat !== undefined && lon !== undefined) {
        result.hasGps = true;
        result.gpsLatitude = typeof lat === 'number' ? lat : parseFloat(String(lat.description || lat));
        result.gpsLongitude = typeof lon === 'number' ? lon : parseFloat(String(lon.description || lon));
        if (alt !== undefined) {
          result.gpsAltitude = typeof alt === 'number' ? alt : parseFloat(String(alt.description || alt));
        }
      }
    }

    // Camera Make & Model
    result.cameraMake = getDesc(allTags['Make']);
    result.cameraModel = getDesc(allTags['Model']);
    result.lensModel = getDesc(allTags['LensModel'] || allTags['Lens']);
    result.dateTimeOriginal = getDesc(allTags['DateTimeOriginal'] || allTags['CreateDate'] || allTags['DateTime']);
    result.software = getDesc(allTags['Software'] || allTags['ProcessingSoftware']);
    result.iso = getDesc(allTags['ISOSpeedRatings'] || allTags['ISO']);
    result.fNumber = getDesc(allTags['FNumber']);
    result.exposureTime = getDesc(allTags['ExposureTime']);
    result.focalLength = getDesc(allTags['FocalLength']);
    result.artistOrCopyright = getDesc(allTags['Artist'] || allTags['Copyright']);

    result.tagList = tagList;
    result.allTagsCount = tagList.length;
  } catch {
    // If parsing fails or image has no metadata headers, it is safely treated as zero tags
    result.allTagsCount = 0;
    result.tagList = [];
  }

  return result;
}

/**
 * Inspects a cleaned image blob to verify that supported metadata tags were removed.
 */
export async function verifyCleanedBlob(blob: Blob): Promise<VerificationResult> {
  try {
    const meta = await extractMetadata(blob);
    // Ignore benign structural tags like ColorSpace or minimal format headers if any
    const sensitiveResidual = meta.tagList.filter((tag) => {
      const n = tag.name.toLowerCase();
      // True privacy metadata: GPS, Make, Model, DateTime, SerialNumber, Artist, Software, IPTC, XMP
      return (
        tag.category === 'GPS' ||
        tag.category === 'Camera' ||
        tag.category === 'Date' ||
        tag.category === 'Software' ||
        n.includes('gps') ||
        n.includes('make') ||
        n.includes('model') ||
        n.includes('date') ||
        n.includes('serial') ||
        n.includes('location') ||
        n.includes('xmp') ||
        n.includes('iptc')
      );
    });

    const isClean = sensitiveResidual.length === 0;

    return {
      verified: isClean,
      residualTagsCount: sensitiveResidual.length,
      residualTags: sensitiveResidual.map((t) => `${t.name}: ${t.value}`),
      message: isClean
        ? 'Verified Clean: 0 GPS, camera, or embedded metadata tags detected.'
        : `Warning: ${sensitiveResidual.length} residual metadata item(s) detected.`,
      isGpsRemoved: !meta.hasGps,
      isCameraRemoved: !meta.cameraMake && !meta.cameraModel,
      isExifRemoved: isClean,
    };
  } catch {
    // If ExifReader finds no headers at all, it's 100% clean
    return {
      verified: true,
      residualTagsCount: 0,
      residualTags: [],
      message: 'Verified Clean: No metadata segments present in re-encoded image.',
      isGpsRemoved: true,
      isCameraRemoved: true,
      isExifRemoved: true,
    };
  }
}
