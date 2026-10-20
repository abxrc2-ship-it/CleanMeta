import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { HistoryRecord } from '../types';

function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ]);
}

/**
 * Saves a processing history record into Firestore under users/{userId}/history/{recordId}
 */
export async function saveHistoryRecord(
  userId: string,
  recordData: Omit<HistoryRecord, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  const recordId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  const record: HistoryRecord = {
    ...recordData,
    id: recordId,
    userId,
    createdAt: now,
  };

  // Always save locally immediately for zero-delay offline experience
  saveLocalFallbackHistory(userId, record);

  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'history', recordId);
      const cleanData: Record<string, any> = {};
      for (const [k, v] of Object.entries(record)) {
        if (v !== undefined) {
          cleanData[k] = v;
        }
      }
      await withTimeout(setDoc(docRef, cleanData), 2500);
    } catch (err) {
      // Local fallback is already saved
      console.warn('Firestore write notice (local fallback retained):', err);
    }
  }

  return recordId;
}

/**
 * Loads the user's history records from Firestore (ordered by creation date descending)
 */
export async function loadUserHistory(userId: string): Promise<HistoryRecord[]> {
  if (!userId) return [];

  if (db) {
    try {
      const historyCol = collection(db, 'users', userId, 'history');
      const q = query(historyCol, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await withTimeout(getDocs(q), 3000);

      const records: HistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as HistoryRecord;
        records.push({
          ...data,
          id: docSnap.id,
        });
      });

      return records;
    } catch (err) {
      console.warn('Firestore load notice, using local cache:', err);
      return loadLocalFallbackHistory(userId);
    }
  }

  return loadLocalFallbackHistory(userId);
}

/**
 * Deletes a single history record from Firestore
 */
export async function deleteUserHistoryRecord(userId: string, recordId: string): Promise<void> {
  deleteLocalFallbackRecord(userId, recordId);
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'history', recordId);
      await withTimeout(deleteDoc(docRef), 2500);
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  }
}

/**
 * Clears all history records for a user
 */
export async function clearAllUserHistory(userId: string): Promise<void> {
  localStorage.removeItem(`cleanmeta_hist_${userId}`);
  if (db) {
    try {
      const historyCol = collection(db, 'users', userId, 'history');
      const snapshot = await withTimeout(getDocs(historyCol), 3000);
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await withTimeout(batch.commit(), 3000);
    } catch (err) {
      console.warn('Firestore clear notice:', err);
    }
  }
}

function saveLocalFallbackHistory(userId: string, record: HistoryRecord) {
  try {
    const key = `cleanmeta_hist_${userId}`;
    const existing = loadLocalFallbackHistory(userId);
    const updated = [record, ...existing.filter((r) => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore storage quota
  }
}

function loadLocalFallbackHistory(userId: string): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(`cleanmeta_hist_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function deleteLocalFallbackRecord(userId: string, recordId: string) {
  try {
    const key = `cleanmeta_hist_${userId}`;
    const existing = loadLocalFallbackHistory(userId);
    const updated = existing.filter((r) => r.id !== recordId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}
