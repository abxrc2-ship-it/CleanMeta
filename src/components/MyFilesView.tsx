import React, { useState } from 'react';
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
} from 'lucide-react';
import { StoredFileItem, UserProfile } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface MyFilesViewProps {
  user: UserProfile | null;
  files: StoredFileItem[];
  onDeleteFile: (id: string) => void;
  onOpenAuth: () => void;
}

export const MyFilesView: React.FC<MyFilesViewProps> = ({
  user,
  files,
  onDeleteFile,
  onOpenAuth,
}) => {
  const [search, setSearch] = useState('');

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                My Processed Files & Storage
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage your temporary files, downloadable outputs, and storage retention.
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Authenticated: {user.email || user.displayName}</span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-900 hover:bg-blue-100 self-start sm:self-auto"
          >
            Sign in for Cloud Storage
          </button>
        )}
      </div>

      {/* Storage Allowance Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Files</span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{files.length} documents</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Used</span>
          <p className="text-lg font-extrabold text-blue-600 mt-1">
            {formatBytes(files.reduce((acc, f) => acc + f.size, 0))} <span className="text-xs text-slate-400 font-normal">/ 1 GB test quota</span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto-Purge</span>
          <p className="text-lg font-extrabold text-teal-600 mt-1">3–7 Days <span className="text-xs text-slate-400 font-normal">TTL configured</span></p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <HardDrive className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">No files in your vault</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Files you process in CleanMeta and choose to save temporarily will appear here. All data is scoped exclusively to your session.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <input
              type="text"
              placeholder="Search my files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-full max-w-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                    {file.mimeType.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-sm">
                      {file.filename}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>From: {file.sourceTool}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-teal-600">
                        <Clock className="w-3 h-3" />
                        <span>Expires in 3 days</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <a
                    href={file.url}
                    download={file.filename}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1 hover:bg-blue-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
