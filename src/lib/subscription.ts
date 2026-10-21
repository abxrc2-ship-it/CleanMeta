/**
 * Subscription, Storage Quotas & Admin License Key System
 * CleanMeta International Architecture (English Only)
 * 
 * Free Baseline Quota: 50 MB
 * Admin can mint custom keys with any quota: 200 MB, 500 MB, 1,024 MB, or custom MB.
 */

export type UserSubscriptionTier = 'free' | 'pro' | 'founder' | 'custom';

export interface SubscriptionStatus {
  tier: UserSubscriptionTier;
  storageQuotaBytes: number;
  storageQuotaMB: number;
  isPro: boolean;
  isFounder: boolean;
  dailyLimit?: number;
  activatedCode?: string;
  activatedAt?: number;
}

export const FREE_STORAGE_QUOTA_BYTES = 50 * 1024 * 1024; // 50 MB
export const PRO_STORAGE_QUOTA_BYTES = 200 * 1024 * 1024; // 200 MB
export const FOUNDER_STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1,024 MB (1 GB)

const PROMO_CODES_VAULT: Record<string, { tier: UserSubscriptionTier; quotaMB: number; label: string }> = {
  'CLEANMETA-PRO-2026': { tier: 'pro', quotaMB: 200, label: 'Pro Beta Access (200 MB)' },
  'RAYHAN-VIP': { tier: 'founder', quotaMB: 1024, label: 'Founder VIP Pass (1 GB)' },
  'PRO-TEST-PASS': { tier: 'pro', quotaMB: 200, label: 'VIP Testing Access (200 MB)' },
  'BETA-ACCESS-200MB': { tier: 'pro', quotaMB: 200, label: 'Early Adopter 200 MB Vault' },
  'FOUNDER-RAYHAN': { tier: 'founder', quotaMB: 1024, label: 'Founder Full Suite Access' },
};

const SUBSCRIPTION_STORAGE_KEY = 'cleanmeta-user-subscription';
const DYNAMIC_KEYS_STORAGE_KEY = 'cleanmeta-custom-license-keys';
const ADMIN_PASSCODE_KEY = 'cleanmeta-admin-passcode';
const DEFAULT_ADMIN_PASSCODE = 'admin2026';
export const ADMIN_EMAIL = 'abxrc2@gmail.com';

export interface DynamicLicenseKey {
  code: string;
  tier: UserSubscriptionTier;
  storageQuotaMB: number;
  storageQuotaBytes: number;
  dailyLimit: number;
  createdAt: number;
  note?: string;
  customerEmail?: string;
  isRedeemed?: boolean;
  redeemedAt?: number;
  isRevoked?: boolean;
}

export function getUserSubscription(): SubscriptionStatus {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const quotaMB = Number(data.storageQuotaMB) || (data.tier === 'founder' ? 1024 : data.tier === 'pro' ? 200 : 50);
      const quotaBytes = quotaMB * 1024 * 1024;

      return {
        tier: data.tier || 'pro',
        storageQuotaBytes: quotaBytes,
        storageQuotaMB: quotaMB,
        isPro: data.tier !== 'free',
        isFounder: data.tier === 'founder' || quotaMB >= 1024,
        dailyLimit: data.dailyLimit || (data.tier === 'free' ? 10 : 100),
        activatedCode: data.activatedCode,
        activatedAt: data.activatedAt,
      };
    }
  } catch {
    // fallback
  }

  // Default Free Plan
  return {
    tier: 'free',
    storageQuotaBytes: FREE_STORAGE_QUOTA_BYTES,
    storageQuotaMB: 50,
    isPro: false,
    isFounder: false,
    dailyLimit: 10,
  };
}

export function getCustomLicenseKeys(): DynamicLicenseKey[] {
  try {
    const raw = localStorage.getItem(DYNAMIC_KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function generateCustomLicenseKey(options: {
  quotaMB: number;
  tier?: UserSubscriptionTier;
  note?: string;
  dailyLimit?: number;
  customerEmail?: string;
}): DynamicLicenseKey {
  const { quotaMB, tier = 'pro', note, dailyLimit = 100, customerEmail } = options;
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const prefix = quotaMB >= 1024 ? 'CM-FOUNDER' : quotaMB >= 500 ? 'CM-POWER' : 'CM-PRO';
  const code = `${prefix}-${quotaMB}MB-${datePart}-${randomPart}`;

  const newKey: DynamicLicenseKey = {
    code,
    tier,
    storageQuotaMB: quotaMB,
    storageQuotaBytes: quotaMB * 1024 * 1024,
    dailyLimit,
    createdAt: Date.now(),
    note: note || `${quotaMB} MB Customer License`,
    customerEmail,
    isRedeemed: false,
    isRevoked: false,
  };

  const existing = getCustomLicenseKeys();
  localStorage.setItem(DYNAMIC_KEYS_STORAGE_KEY, JSON.stringify([newKey, ...existing]));
  return newKey;
}

export function revokeCustomLicenseKey(code: string): boolean {
  const existing = getCustomLicenseKeys();
  const updated = existing.map((k) => (k.code === code ? { ...k, isRevoked: true } : k));
  localStorage.setItem(DYNAMIC_KEYS_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

export function deleteCustomLicenseKey(code: string): boolean {
  const existing = getCustomLicenseKeys();
  const updated = existing.filter((k) => k.code !== code);
  localStorage.setItem(DYNAMIC_KEYS_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

export function redeemPromoCode(code: string): { success: boolean; message: string; status?: SubscriptionStatus } {
  const normalized = code.trim().toUpperCase();

  let targetTier: UserSubscriptionTier | null = null;
  let targetQuotaMB = 200;
  let targetLabel = 'CleanMeta Pro Pass';
  let targetDailyLimit = 100;

  if (PROMO_CODES_VAULT[normalized]) {
    targetTier = PROMO_CODES_VAULT[normalized].tier;
    targetQuotaMB = PROMO_CODES_VAULT[normalized].quotaMB;
    targetLabel = PROMO_CODES_VAULT[normalized].label;
  } else {
    const customKeys = getCustomLicenseKeys();
    const match = customKeys.find((k) => k.code === normalized);
    if (match) {
      if (match.isRevoked) {
        return {
          success: false,
          message: 'This license key has been revoked or invalidated by the administrator.',
        };
      }
      if (match.isRedeemed) {
        return {
          success: false,
          message: 'This license code has already been redeemed.',
        };
      }

      targetTier = match.tier;
      targetQuotaMB = match.storageQuotaMB;
      targetDailyLimit = match.dailyLimit || 100;
      targetLabel = `${targetQuotaMB} MB Cloud Vault Pass`;

      // Mark key as redeemed
      const updated = customKeys.map((k) =>
        k.code === normalized ? { ...k, isRedeemed: true, redeemedAt: Date.now() } : k
      );
      localStorage.setItem(DYNAMIC_KEYS_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  if (!targetTier) {
    return {
      success: false,
      message: 'Invalid or expired redemption code. Please verify your code or contact support.',
    };
  }

  const newStatus: SubscriptionStatus = {
    tier: targetTier,
    storageQuotaBytes: targetQuotaMB * 1024 * 1024,
    storageQuotaMB: targetQuotaMB,
    isPro: true,
    isFounder: targetTier === 'founder' || targetQuotaMB >= 1024,
    dailyLimit: targetDailyLimit,
    activatedCode: normalized,
    activatedAt: Date.now(),
  };

  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newStatus));

  return {
    success: true,
    message: `Success! Your account has been upgraded with ${targetQuotaMB} MB Cloud Storage quota (${targetLabel}).`,
    status: newStatus,
  };
}

export function activateProDirectly(quotaMB = 200, tier: UserSubscriptionTier = 'pro'): SubscriptionStatus {
  const newStatus: SubscriptionStatus = {
    tier,
    storageQuotaBytes: quotaMB * 1024 * 1024,
    storageQuotaMB: quotaMB,
    isPro: true,
    isFounder: tier === 'founder' || quotaMB >= 1024,
    dailyLimit: 100,
    activatedCode: 'DIRECT-ACTIVATION',
    activatedAt: Date.now(),
  };

  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newStatus));
  return newStatus;
}

export function resetSubscriptionToFree(): void {
  localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
}

export function getAdminPasscode(): string {
  try {
    return localStorage.getItem(ADMIN_PASSCODE_KEY) || DEFAULT_ADMIN_PASSCODE;
  } catch {
    return DEFAULT_ADMIN_PASSCODE;
  }
}

export function setAdminPasscode(newCode: string): void {
  localStorage.setItem(ADMIN_PASSCODE_KEY, newCode.trim());
}

export function verifyAdminAccess(passcode?: string, email?: string): boolean {
  if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const currentPasscode = getAdminPasscode();
  return Boolean(passcode && passcode.trim() === currentPasscode);
}
