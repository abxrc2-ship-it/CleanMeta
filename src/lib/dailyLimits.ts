/**
 * Daily Usage Limit Tracker
 * 
 * Free Limits:
 * - Local Sandbox Mode: 10 photos / operations per day
 * - Web Server Mode: 5 photos / operations per day
 * 
 * Pro / Founder Limits:
 * - 100 photos / operations per day
 */

import { getUserSubscription } from './subscription';

interface DailyUsageRecord {
  date: string; // YYYY-MM-DD
  localCount: number;
  serverCount: number;
}

const DAILY_LIMITS_KEY = 'cleanmeta-daily-usage';

export const FREE_LOCAL_DAILY_LIMIT = 10;
export const FREE_SERVER_DAILY_LIMIT = 5;
export const PRO_DAILY_LIMIT = 100;

function getTodayString(): string {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getDailyUsage(): DailyUsageRecord {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem(DAILY_LIMITS_KEY);
    if (raw) {
      const parsed: DailyUsageRecord = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  const fresh: DailyUsageRecord = {
    date: today,
    localCount: 0,
    serverCount: 0,
  };
  localStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(fresh));
  return fresh;
}

export function getRemainingOperations(mode: 'local' | 'cloud'): {
  used: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  isPro: boolean;
} {
  const sub = getUserSubscription();
  const usage = getDailyUsage();

  if (sub.isPro) {
    const used = mode === 'local' ? usage.localCount : usage.serverCount;
    const limit = PRO_DAILY_LIMIT;
    const remaining = Math.max(0, limit - used);
    return {
      used,
      limit,
      remaining,
      isExceeded: remaining <= 0,
      isPro: true,
    };
  }

  const used = mode === 'local' ? usage.localCount : usage.serverCount;
  const limit = mode === 'local' ? FREE_LOCAL_DAILY_LIMIT : FREE_SERVER_DAILY_LIMIT;
  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    isExceeded: remaining <= 0,
    isPro: false,
  };
}

export function incrementDailyUsage(mode: 'local' | 'cloud', count: number = 1): boolean {
  const today = getTodayString();
  const current = getDailyUsage();
  
  if (current.date !== today) {
    current.date = today;
    current.localCount = 0;
    current.serverCount = 0;
  }

  if (mode === 'local') {
    current.localCount += count;
  } else {
    current.serverCount += count;
  }

  localStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(current));
  return true;
}
