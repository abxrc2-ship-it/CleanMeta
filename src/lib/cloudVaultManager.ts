import { RetentionPreference, StoredFileItem, HistoryRecord } from '../types';
import { uploadToVercelBlob, deleteFromVercelBlob } from './blobStorage';
import { saveHistoryRecord, loadUserHistory, deleteUserHistoryRecord } from './firestore';
import { getUserSubscription, FREE_STORAGE_QUOTA_BYTES } from './subscription';

const LOCAL_STORAGE_VAULT_KEY = 'cleanmeta-vault-files-v2';
export const TOTAL_STORAGE_ALLOWANCE_BYTES = FREE_STORAGE_QUOTA_BYTES; // 50 MB default per account (up to 200 MB Pro)

export interface VaultFileItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string; // Persistent base64 data URL for instant image previews
  blobPathname?: string;
  createdAt: number;
  expiresAt: number; // Timestamp when file is auto-purged
  retention: RetentionPreference;
  sourceTool: string;
  isCloudSynced: boolean;
}

/**
 * Generate a compact base64 JPEG thumbnail (< 5KB) so image previews NEVER break
 */
export async function generateThumbnailDataUrl(blob: Blob, maxDim = 160): Promise<string | undefined> {
  if (!blob.type.startsWith('image/')) return undefined;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objUrl = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(undefined);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(undefined);
      };
      img.src = objUrl;
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Convert RetentionPreference to duration in milliseconds
 * Min: 3 hours, Max: 2 days (48 hours)
 */
export function getRetentionDurationMs(retention: RetentionPreference): number {
  switch (retention) {
    case '3hours':
      return 3 * 60 * 60 * 1000;
    case '6hours':
      return 6 * 60 * 60 * 1000;
    case '12hours':
      return 12 * 60 * 60 * 1000;
    case '24hours':
    case '1day':
      return 24 * 60 * 60 * 1000;
    case '48hours':
    case '2days':
      return 48 * 60 * 60 * 1000;
    case 'none':
    default:
      return 0;
  }
}

/**
 * Format remaining time until auto-purge
 */
export function formatRemainingTime(expiresAt: number): {
  isExpired: boolean;
  formatted: string;
  hours: number;
  minutes: number;
} {
  const diff = expiresAt - Date.now();
  if (diff <= 0) {
    return { isExpired: true, formatted: 'Expired (Purging)', hours: 0, minutes: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return { isExpired: false, formatted: `${days}d ${remHours}h left`, hours, minutes };
  }

  if (hours > 0) {
    return { isExpired: false, formatted: `${hours}h ${minutes}m left`, hours, minutes };
  }

  return { isExpired: false, formatted: `${Math.max(1, minutes)}m left`, hours, minutes };
}

/**
 * Get all files currently in the local/offline vault
 */
export function getLocalVaultFiles(): VaultFileItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY);
    if (!raw) return [];
    const parsed: VaultFileItem[] = JSON.parse(raw);
    const now = Date.now();

    // Filter out expired files immediately
    const valid = parsed.filter((f) => f.expiresAt > now);
    if (valid.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

/**
 * Save a newly processed file to the Cloud Vault / History
 */
export async function saveFileToCloudVault(
  blob: Blob,
  filename: string,
  retention: RetentionPreference,
  sourceTool: string,
  userId?: string | null
): Promise<{ success: boolean; item?: VaultFileItem; error?: string }> {
  // If retention is 'none' (Incognito Mode), do not save
  if (retention === 'none') {
    return { success: false, error: 'Incognito mode: 0 bytes retained.' };
  }

  const durationMs = getRetentionDurationMs(retention);
  const now = Date.now();
  const expiresAt = now + durationMs;
  const id = `vault_${now}_${Math.random().toString(36).substring(2, 9)}`;

  let isCloudSynced = false;
  let cloudUrl: string | undefined = undefined;
  let blobPathname: string | undefined = undefined;

  // Try real Vercel Blob cloud upload if user is signed in
  if (userId) {
    try {
      const uploadRes = await uploadToVercelBlob(blob, filename, retention, sourceTool);
      if (uploadRes.success && uploadRes.blobUrl) {
        isCloudSynced = true;
        cloudUrl = uploadRes.blobUrl;
        blobPathname = uploadRes.blobPathname;
        if (uploadRes.expiresAt) {
          // Sync exact server expiry if provided
        }
      }
    } catch (err) {
      console.warn('Vercel Blob cloud upload unavailable, storing securely in local vault:', err);
    }
  }

  // Fallback to object URL or cloud URL
  const fileUrl = cloudUrl || URL.createObjectURL(blob);
  const thumbnailUrl = await generateThumbnailDataUrl(blob, 180);

  const vaultItem: VaultFileItem = {
    id,
    filename,
    size: blob.size,
    mimeType: blob.type || 'image/jpeg',
    url: fileUrl,
    thumbnailUrl,
    blobPathname,
    createdAt: now,
    expiresAt,
    retention,
    sourceTool,
    isCloudSynced,
  };

  // Save to persistent storage
  try {
    const existing = getLocalVaultFiles();
    const updated = [vaultItem, ...existing.filter((f) => f.id !== id)];
    localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(updated));

    // Also record in Firestore history if user is authenticated
    if (userId) {
      saveHistoryRecord(userId, {
        tool: sourceTool,
        originalFileName: filename,
        inputFormat: blob.type || 'image/jpeg',
        outputFormat: blob.type || 'image/jpeg',
        originalSize: blob.size,
        processedSize: blob.size,
        status: 'success',
        retention,
        blobUrl: cloudUrl,
        blobPathname,
        expiresAt,
      }).catch((e: any) => console.warn('Firestore history record notice:', e));
    }

    return { success: true, item: vaultItem };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save to vault.' };
  }
}

/**
 * Remove a file from Cloud and Local Vault
 */
export async function removeFileFromVault(id: string, userId?: string | null): Promise<void> {
  const existing = getLocalVaultFiles();
  const target = existing.find((f) => f.id === id);

  if (target?.blobPathname) {
    deleteFromVercelBlob(target.blobPathname).catch(() => {});
  }

  const updated = existing.filter((f) => f.id !== id);
  localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(updated));

  if (userId && target) {
    deleteUserHistoryRecord(userId, id).catch(() => {});
  }
}

/**
 * Purge all expired files (auto-clean ticker)
 */
export function purgeExpiredFiles(): number {
  const now = Date.now();
  const existing = getLocalVaultFiles();
  const remaining = existing.filter((f) => f.expiresAt > now);
  const purgedCount = existing.length - remaining.length;

  if (purgedCount > 0) {
    localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(remaining));
  }
  return purgedCount;
}

/**
 * Clear all vault files manually
 */
export function clearEntireVault(): void {
  localStorage.removeItem(LOCAL_STORAGE_VAULT_KEY);
}

/**
 * Calculate total storage used out of user subscription quota (50 MB Free, 200 MB Pro, 1 GB Founder)
 */
export function calculateStorageUsage(files: VaultFileItem[]): {
  usedBytes: number;
  totalBytes: number;
  usedFormatted: string;
  totalFormatted: string;
  percentage: number;
  isNearQuota: boolean;
} {
  const sub = getUserSubscription();
  const totalQuota = sub.storageQuotaBytes;
  const usedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const percentage = Math.min(100, Math.max(0, (usedBytes / totalQuota) * 100));

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return {
    usedBytes,
    totalBytes: totalQuota,
    usedFormatted: formatSize(usedBytes),
    totalFormatted: `${sub.storageQuotaMB} MB`,
    percentage,
    isNearQuota: percentage > 85,
  };
}
