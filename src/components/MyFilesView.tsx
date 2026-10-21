import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Search,
  HardDrive,
  AlertCircle,
  Cloud,
  LogIn,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { UserProfile, StoredFileItem } from '../types';
import {
  VaultFileItem,
  getLocalVaultFiles,
  removeFileFromVault,
  clearEntireVault,
  purgeExpiredFiles,
  calculateStorageUsage,
  formatRemainingTime,
} from '../lib/cloudVaultManager';
import { formatBytes } from '../lib/imageProcessor';
import { getUserSubscription } from '../lib/subscription';

interface MyFilesViewProps {
  user: UserProfile | null;
  files: StoredFileItem[];
  onDeleteFile: (id: string) => void;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
}

export const MyFilesView: React.FC<MyFilesViewProps> = ({
  user,
  onOpenAuth,
  onOpenSettings,
}) => {
  const [vaultFiles, setVaultFiles] = useState<VaultFileItem[]>([]);
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<VaultFileItem | null>(null);

  const sub = getUserSubscription();

  const refreshFiles = () => {
    purgeExpiredFiles();
    setVaultFiles(getLocalVaultFiles());
  };

  useEffect(() => {
    refreshFiles();
    const interval = setInterval(() => {
      refreshFiles();
    }, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDelete = async (id: string) => {
    await removeFileFromVault(id, user?.uid);
    if (previewFile?.id === id) setPreviewFile(null);
    refreshFiles();
  };

  const handleClear = () => {
    if (!window.confirm('Purge all files in cloud vault now?')) return;
    clearEntireVault();
    setPreviewFile(null);
    refreshFiles();
  };

  const usage = calculateStorageUsage(vaultFiles);
  const filtered = vaultFiles.filter((f) =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const isImageFile = (file: VaultFileItem) => {
    return (
      file.mimeType.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.filename)
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>My Cloud Storage Vault</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    sub.isPro
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {sub.isFounder ? 'Founder (1 GB)' : sub.isPro ? 'Pro (200 MB)' : 'Free (50 MB)'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                Saved outputs with image thumbnail previews and auto-destruct countdown timers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {user ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[150px]">{user.email || user.displayName}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 font-bold text-xs border border-blue-200 dark:border-neutral-700 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in for Cloud Storage</span>
            </button>
          )}

          {vaultFiles.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 font-bold text-xs transition cursor-pointer"
            >
              Purge All
            </button>
          )}
        </div>
      </div>

      {/* Storage Allowance Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Files</span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            {vaultFiles.length} <span className="text-xs font-normal text-slate-400">files</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account Storage Quota
          </span>
          <p className="text-lg font-extrabold text-blue-600 dark:text-cyan-400 mt-1">
            {usage.usedFormatted} <span className="text-xs text-slate-400 font-normal">/ {usage.totalFormatted}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto-Purge Window</span>
          <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            3h – 2 Days <span className="text-xs text-slate-400 font-normal">Strict TTL</span>
          </p>
        </div>
      </div>

      {/* Storage Meter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs mb-6 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Vault Capacity ({usage.usedFormatted} of {usage.totalFormatted})
          </span>
          <span className="text-slate-500 font-mono">{usage.percentage.toFixed(1)}% Used</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              usage.isNearQuota ? 'bg-rose-500' : 'bg-blue-600 dark:bg-cyan-500'
            }`}
            style={{ width: `${Math.max(1, usage.percentage)}%` }}
          />
        </div>
      </div>

      {vaultFiles.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 text-center shadow-xs">
          <HardDrive className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
            No files in your cloud vault
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Files you process in CleanMeta and choose to save temporarily will appear here. If you choose &quot;No Save&quot;, they are processed in RAM with zero storage.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vault files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {vaultFiles.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden text-xs">
            {filtered.map((file) => {
              const countdown = formatRemainingTime(file.expiresAt);
              const isImg = isImageFile(file);
              const isPdf = file.mimeType.includes('pdf');

              return (
                <div
                  key={file.id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-neutral-900/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* THUMBNAIL PREVIEW (Clickable for full preview!) */}
                    {isImg ? (
                      <div
                        onClick={() => setPreviewFile(file)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 shrink-0 cursor-pointer group shadow-2xs hover:border-blue-500 transition"
                        title="Click to view full preview"
                      >
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.filename}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            if (file.thumbnailUrl && e.currentTarget.src !== file.thumbnailUrl) {
                              e.currentTarget.src = file.thumbnailUrl;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                          isPdf
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                        }`}
                      >
                        {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {file.filename}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatBytes(file.size)}
                        </span>
                        <span>•</span>
                        <span>{file.sourceTool}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>Auto-cleans in {countdown.formatted}</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions: Preview, Download, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
                    {isImg && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Preview image"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                    )}

                    <a
                      href={file.url}
                      download={file.filename}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
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
        </div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {previewFile.filename}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 dark:bg-black/50 min-h-[300px]">
              <img
                src={previewFile.url || previewFile.thumbnailUrl}
                alt={previewFile.filename}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                onError={(e) => {
                  if (previewFile.thumbnailUrl && e.currentTarget.src !== previewFile.thumbnailUrl) {
                    e.currentTarget.src = previewFile.thumbnailUrl;
                  }
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <div className="text-slate-500 font-mono">
                <span>{formatBytes(previewFile.size)}</span>
                <span className="mx-2">•</span>
                <span>Auto-cleans in {formatRemainingTime(previewFile.expiresAt).formatted}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.filename}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
