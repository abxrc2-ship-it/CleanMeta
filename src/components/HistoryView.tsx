import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Cloud,
  ShieldCheck,
  RefreshCw,
  Minimize2,
  LogIn,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { HistoryRecord, UserProfile } from '../types';
import { loadUserHistory, deleteUserHistoryRecord, clearAllUserHistory } from '../lib/firestore';
import { deleteFromVercelBlob } from '../lib/blobStorage';
import { formatBytes } from '../lib/imageProcessor';

interface HistoryViewProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user, onOpenAuth }) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await loadUserHistory(user.uid);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setRecords([]);
    }
  }, [user]);

  const handleDeleteRecord = async (record: HistoryRecord) => {
    if (!user) return;
    try {
      setDeletingId(record.id);
      // 1. Delete from Vercel Blob if stored
      if (record.blobPathname) {
        await deleteFromVercelBlob(record.blobPathname);
      }
      // 2. Delete from Firestore
      await deleteUserHistoryRecord(user.uid, record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear your entire processing history?')) return;

    try {
      setLoading(true);
      // Delete any associated blobs
      for (const rec of records) {
        if (rec.blobPathname) {
          await deleteFromVercelBlob(rec.blobPathname);
        }
      }
      await clearAllUserHistory(user.uid);
      setRecords([]);
    } catch (err: any) {
      alert(err.message || 'Failed to clear history.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            User History Requires Login
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Sign in with Google or Email to save and access your processing history and temporary cloud backups across devices.
          </p>
          <button
            onClick={onOpenAuth}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন / সাইন আপ করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Processing History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent log saved in your private Firestore database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh history"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && records.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading your history from Firestore...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && records.length === 0 && (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No processing history yet
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Process photos using the Metadata Remover, Converter, or Compressor to view history here.
            </p>
          </div>
        )}

        {/* History list */}
        <div className="space-y-3">
          {records.map((rec) => {
            const dateStr = new Date(rec.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            const isExpired = rec.expiresAt ? Date.now() > rec.expiresAt : false;

            return (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Tool icon */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {rec.tool === 'metadata-remover' ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    ) : rec.tool === 'converter' ? (
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Minimize2 className="w-4 h-4 text-purple-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                        {rec.originalFileName}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {rec.tool.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                      <span>{formatBytes(rec.originalSize)}</span>
                      <span>→</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatBytes(rec.processedSize)}
                      </span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions & Retention */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {rec.blobUrl && !isExpired ? (
                    <a
                      href={rec.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 transition"
                      title="Download cloud backup"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Cloud Copy</span>
                    </a>
                  ) : rec.retention !== 'none' ? (
                    <span className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Expired
                    </span>
                  ) : null}

                  <button
                    onClick={() => handleDeleteRecord(rec)}
                    disabled={deletingId === rec.id}
                    title="Delete record"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
