import React from 'react';
import {
  Trash2,
  Download,
  Archive,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  SplitSquareVertical,
  MapPin,
  Camera,
  Layers,
  Settings2,
  SlidersHorizontal,
  Minimize2,
} from 'lucide-react';
import { CleanFormatPreference, PhotoItem } from '../types';
import { formatBytes } from '../lib/imageProcessor';
import { downloadSinglePhoto } from '../lib/zipDownloader';

interface QueueListProps {
  photos: PhotoItem[];
  onRemovePhoto: (id: string) => void;
  onClearQueue: () => void;
  onProcessAll: () => void;
  onRetryPhoto: (id: string) => void;
  onDownloadZip: () => void;
  onInspectMetadata: (photo: PhotoItem) => void;
  onComparePhoto: (photo: PhotoItem) => void;
  formatPreference: CleanFormatPreference;
  onChangeFormatPreference: (format: CleanFormatPreference) => void;
  retentionPreference: import('../types').RetentionPreference;
  onChangeRetentionPreference: (retention: import('../types').RetentionPreference) => void;
  onSendToTool?: (tool: import('../types').ToolType, file: File) => void;
  isProcessing: boolean;
  isZipping: boolean;
  zipProgress: number;
}

export const QueueList: React.FC<QueueListProps> = ({
  photos,
  onRemovePhoto,
  onClearQueue,
  onProcessAll,
  onRetryPhoto,
  onDownloadZip,
  onInspectMetadata,
  onComparePhoto,
  formatPreference,
  onChangeFormatPreference,
  retentionPreference,
  onChangeRetentionPreference,
  onSendToTool,
  isProcessing,
  isZipping,
  zipProgress,
}) => {
  if (photos.length === 0) return null;

  const cleanedCount = photos.filter((p) => p.status === 'cleaned').length;
  const queuedCount = photos.filter((p) => p.status === 'queued' || p.status === 'error').length;
  const errorCount = photos.filter((p) => p.status === 'error').length;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-8 pb-16">
      {/* Action Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Photo Queue ({photos.length})
              </h2>
              {cleanedCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  {cleanedCount} Cleaned
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {queuedCount > 0
                ? `${queuedCount} photo(s) ready for metadata removal.`
                : 'All photos have been processed locally and verified.'}
            </p>
          </div>

          {/* Format & Retention preference dropdowns & Clear Queue */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="format-select" className="text-slate-600 dark:text-slate-300 font-medium">
                Output:
              </label>
              <select
                id="format-select"
                value={formatPreference}
                onChange={(e) => onChangeFormatPreference(e.target.value as CleanFormatPreference)}
                disabled={isProcessing}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="auto" className="dark:bg-slate-800">Auto (Preserve)</option>
                <option value="jpeg" className="dark:bg-slate-800">JPG (High Quality 95%)</option>
                <option value="png" className="dark:bg-slate-800">PNG (Lossless)</option>
                <option value="webp" className="dark:bg-slate-800">WebP (Optimized)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
              <label htmlFor="retention-select" className="text-slate-600 dark:text-slate-300 font-medium">
                Storage:
              </label>
              <select
                id="retention-select"
                value={retentionPreference}
                onChange={(e) => onChangeRetentionPreference(e.target.value as any)}
                disabled={isProcessing}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="none" className="dark:bg-slate-800">Local Only (অফলাইন - কোনো ক্লাউড নয়)</option>
                <option value="1day" className="dark:bg-slate-800">Cloud: 1 Day (১ দিন)</option>
                <option value="2days" className="dark:bg-slate-800">Cloud: 2 Days (২ দিন)</option>
                <option value="3days" className="dark:bg-slate-800">Cloud: 3 Days (৩ দিন)</option>
                <option value="4days" className="dark:bg-slate-800">Cloud: 4 Days (৪ দিন)</option>
                <option value="7days" className="dark:bg-slate-800">Cloud: 7 Days (৭ দিন)</option>
                <option value="permanent" className="dark:bg-slate-800">Cloud: Permanent (সর্বোচ্চ আনলিমিটেড)</option>
              </select>
            </div>

            <button
              onClick={onClearQueue}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={onProcessAll}
            disabled={isProcessing || queuedCount === 0}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              queuedCount === 0
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Removing Metadata...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Remove Metadata ({queuedCount})</span>
              </>
            )}
          </button>

          {cleanedCount > 0 && (
            <button
              onClick={onDownloadZip}
              disabled={isZipping || isProcessing}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>
                {isZipping ? `Creating ZIP (${zipProgress}%)...` : `Download All (${cleanedCount}) as ZIP`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Photo Cards */}
      <div className="space-y-3">
        {photos.map((photo) => {
          const isClean = photo.status === 'cleaned';
          const isPending = photo.status === 'processing';
          const isError = photo.status === 'error';
          const hasGps = photo.originalMetadata?.hasGps;
          const metaCount = photo.originalMetadata?.allTagsCount || 0;

          return (
            <div
              key={photo.id}
              className={`rounded-2xl border transition-all p-3 sm:p-4 bg-white dark:bg-slate-900 ${
                isClean
                  ? 'border-emerald-200 dark:border-emerald-900/60 shadow-xs'
                  : isError
                  ? 'border-rose-300 dark:border-rose-900/80 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                {/* Thumbnail & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    onClick={() => onInspectMetadata(photo)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group"
                    title="Click to inspect metadata"
                  >
                    <img
                      src={photo.cleanedUrl || photo.originalUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {photo.name}
                      </p>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatBytes(photo.size)}</span>
                      {photo.dimensions && (
                        <>
                          <span>•</span>
                          <span>{photo.dimensions.width}×{photo.dimensions.height}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="uppercase text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {photo.type.split('/')[1] || 'IMAGE'}
                      </span>
                    </div>

                    {/* Metadata tags indicator */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {isClean ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified: 0 metadata tags</span>
                        </div>
                      ) : (
                        <>
                          {hasGps && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                              <MapPin className="w-3 h-3 text-rose-600" />
                              <span>GPS Location</span>
                            </div>
                          )}
                          {metaCount > 0 ? (
                            <button
                              onClick={() => onInspectMetadata(photo)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer"
                            >
                              <Camera className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>{metaCount} metadata tag{metaCount > 1 ? 's' : ''} detected</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              No EXIF headers detected
                            </span>
                          )}
                        </>
                      )}

                      {/* Cleaned size comparison */}
                      {isClean && photo.cleanedSize && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Output: {formatBytes(photo.cleanedSize)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Inspect Details Button */}
                  <button
                    onClick={() => onInspectMetadata(photo)}
                    title="View metadata analysis"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="sm:hidden">Inspect</span>
                  </button>

                  {/* Compare button if cleaned */}
                  {isClean && (
                    <button
                      onClick={() => onComparePhoto(photo)}
                      title="Compare Original vs Cleaned"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="sm:hidden">Compare</span>
                    </button>
                  )}

                  {/* Download single clean photo */}
                  {isClean && (
                    <>
                      <button
                        onClick={() => downloadSinglePhoto(photo)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Clean Photo</span>
                      </button>

                      {onSendToTool && photo.cleanedBlob && (
                        <div className="hidden sm:flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const f = new File([photo.cleanedBlob!], photo.name, {
                                type: photo.cleanedFormat || photo.type,
                              });
                              onSendToTool('converter', f);
                            }}
                            title="Open in Converter"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const f = new File([photo.cleanedBlob!], photo.name, {
                                type: photo.cleanedFormat || photo.type,
                              });
                              onSendToTool('compressor', f);
                            }}
                            title="Open in Compressor"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 text-xs font-bold"
                          >
                            <Minimize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Processing spinner */}
                  {isPending && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cleaning...</span>
                    </div>
                  )}

                  {/* Retry button if failed */}
                  {isError && (
                    <button
                      onClick={() => onRetryPhoto(photo.id)}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  {/* Remove from queue */}
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    aria-label={`Remove ${photo.name} from queue`}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Error message detail if error */}
              {isError && photo.errorMessage && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{photo.errorMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
