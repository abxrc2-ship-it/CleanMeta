import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Cloud,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  HardDrive,
  AlertCircle,
  LogIn,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { UserProfile, RetentionPreference } from '../types';
import {
  VaultFileItem,
  getLocalVaultFiles,
  removeFileFromVault,
  clearEntireVault,
  purgeExpiredFiles,
  calculateStorageUsage,
  formatRemainingTime,
  TOTAL_STORAGE_ALLOWANCE_BYTES,
} from '../lib/cloudVaultManager';
import { formatBytes } from '../lib/imageProcessor';

interface HistoryViewProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user, onOpenAuth }) => {
  const [files, setFiles] = useState<VaultFileItem[]>([]);
  const [search, setSearch] = useState('');
  const [lastPurgedNotice, setLastPurgedNotice] = useState<string | null>(null);

  // Load and sync files
  const refreshFiles = () => {
    const purged = purgeExpiredFiles();
    if (purged > 0) {
      setLastPurgedNotice(`Auto-purged ${purged} expired file(s) in accordance with privacy retention policy.`);
      setTimeout(() => setLastPurgedNotice(null), 5000);
    }
    const current = getLocalVaultFiles();
    setFiles(current);
  };

  useEffect(() => {
    refreshFiles();

    // Auto-purge ticker every 20 seconds
    const interval = setInterval(() => {
      refreshFiles();
    }, 20000);

    return () => clearInterval(interval);
  }, [user]);

  const handleDelete = async (id: string) => {
    await removeFileFromVault(id, user?.uid);
    refreshFiles();
  };

  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to purge all stored files and history now?')) return;
    clearEntireVault();
    refreshFiles();
  };

  const usage = calculateStorageUsage(files);
  const filtered = files.filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Processing History &amp; Cloud Vault
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Vercel 1 GB storage with auto-clean timers (3h min to 2 days max).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[140px]">{user.email || user.displayName}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 font-bold text-xs border border-blue-200 dark:border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In for Cloud Sync</span>
            </button>
          )}

          {files.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 font-bold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-Purge Banner notice */}
      {lastPurgedNotice && (
        <div className="mb-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2 animate-in fade-in">
          <Clock className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{lastPurgedNotice}</span>
        </div>
      )}

      {/* 1 GB Vercel Storage Gauge Breakdown Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs mb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Vercel Cloud Storage Allocation
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 text-[10px] font-bold">
              1 GB Quota
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
            <strong>{usage.usedFormatted}</strong> used of <strong>1 GB</strong> ({usage.percentage.toFixed(1)}%)
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              usage.isNearQuota ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'
            }`}
            style={{ width: `${Math.max(2, usage.percentage)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-neutral-400 pt-1 border-t border-slate-100 dark:border-neutral-800">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strict Auto-Purge Active: All files automatically shred when countdown expires</span>
          </span>
          <span>Configured Retention: 3 Hours (Min) to 48 Hours / 2 Days (Max)</span>
        </div>
      </div>

      {/* Search and Files List */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Retained Files</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-xs font-mono font-bold">
              {files.length}
            </span>
          </h2>

          <input
            type="text"
            placeholder="Search history files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {files.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-neutral-900 text-blue-500 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No files currently stored
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              When you process images or PDFs with retention enabled (3 hours up to 2 days), they will appear here with live auto-clean countdown timers.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No files matched "{search}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200/80 dark:border-neutral-800 rounded-xl overflow-hidden text-xs">
            {filtered.map((item) => {
              const countdown = formatRemainingTime(item.expiresAt);
              const isPdf = item.mimeType.includes('pdf');
              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-neutral-900/50 transition"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPdf
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {item.filename}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        <span>{item.sourceTool}</span>
                        <span>•</span>
                        {/* Countdown Badge */}
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                            countdown.hours < 3
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Auto-cleans in {countdown.formatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                    <a
                      href={item.url}
                      download={item.filename}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Purge Now"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
