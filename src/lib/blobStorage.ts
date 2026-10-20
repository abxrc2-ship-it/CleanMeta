import { getCurrentUserToken } from './firebase';
import { RetentionPreference } from '../types';

export interface UploadBlobResponse {
  success: boolean;
  blobUrl?: string;
  blobPathname?: string;
  expiresAt?: number;
  error?: string;
  isUnconfigured?: boolean;
}

/**
 * Uploads a processed image blob to Vercel Blob storage via the server-side API with timeout
 */
export async function uploadToVercelBlob(
  blob: Blob,
  filename: string,
  retention: RetentionPreference,
  tool: string
): Promise<UploadBlobResponse> {
  if (retention === 'none') {
    return { success: false, error: 'Retention is set to local only.' };
  }

  const token = await getCurrentUserToken();
  if (!token) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ক্লাউড স্টোরেজে ফাইল সেভ করার জন্য লগইন করুন।',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('retention', retention);
    formData.append('tool', tool);

    const response = await fetch('/api/blob/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (data.isUnconfigured) {
        return {
          success: false,
          isUnconfigured: true,
          error: data.message || 'Vercel Blob token is not configured on server.',
        };
      }
      return {
        success: false,
        error: data.error || 'Failed to upload to Vercel Blob.',
      };
    }

    return {
      success: true,
      blobUrl: data.url,
      blobPathname: data.pathname,
      expiresAt: data.expiresAt,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Cloud upload timed out. File was saved locally.' : (err.message || 'Network error.'),
    };
  }
}

/**
 * Deletes a stored file from Vercel Blob storage
 */
export async function deleteFromVercelBlob(pathname: string): Promise<boolean> {
  const token = await getCurrentUserToken();
  if (!token) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch('/api/blob/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pathname }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}
