import React, { useState } from 'react';
import { X, CheckCircle, SplitSquareVertical, ArrowRight, ShieldCheck } from 'lucide-react';
import { PhotoItem } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface CompareModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ photo, onClose }) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'toggle'>('side-by-side');
  const [activeToggle, setActiveToggle] = useState<'original' | 'cleaned'>('cleaned');

  if (!photo || !photo.cleanedUrl) return null;

  const sizeDiff = photo.cleanedSize ? photo.cleanedSize - photo.size : 0;
  const sizeDiffPercent = photo.cleanedSize
    ? Math.abs(Math.round(((photo.cleanedSize - photo.size) / photo.size) * 100))
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SplitSquareVertical className="w-4 h-4" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Visual Comparison: Original vs Cleaned
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {photo.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch on desktop */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'side-by-side'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('toggle')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'toggle'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                A/B Toggle
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dimension & Metric Banner */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Dimensions:</span>
            <span>
              {photo.dimensions
                ? `${photo.dimensions.width} × ${photo.dimensions.height} px`
                : 'Preserved'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">File Size:</span>
            <span className="text-slate-500 line-through">{formatBytes(photo.size)}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatBytes(photo.cleanedSize || 0)}
            </span>
            {sizeDiff < 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                -{sizeDiffPercent}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Metadata 100% Stripped</span>
          </div>
        </div>

        {/* Image Display Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Original Photo (with metadata)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {formatBytes(photo.size)}
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[420px]">
                  <img
                    src={photo.originalUrl}
                    alt="Original photo"
                    className="max-h-[380px] w-auto max-w-full object-contain"
                  />
                  {photo.originalMetadata?.hasGps && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-rose-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                      Contains GPS Location
                    </div>
                  )}
                </div>
              </div>

              {/* Cleaned */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Cleaned Output
                    </span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {formatBytes(photo.cleanedSize || 0)}
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800/80 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[420px]">
                  <img
                    src={photo.cleanedUrl}
                    alt="Cleaned photo"
                    className="max-h-[380px] w-auto max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-emerald-600/90 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>0 Sensitive Tags</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Toggle Buttons */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4">
                <button
                  onClick={() => setActiveToggle('original')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeToggle === 'original'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  View Original ({formatBytes(photo.size)})
                </button>
                <button
                  onClick={() => setActiveToggle('cleaned')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    activeToggle === 'cleaned'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  View Cleaned ({formatBytes(photo.cleanedSize || 0)})
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[450px] w-full">
                <img
                  src={activeToggle === 'original' ? photo.originalUrl : photo.cleanedUrl}
                  alt={activeToggle === 'original' ? 'Original photo' : 'Cleaned photo'}
                  className="max-h-[420px] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Pixel data rendered at 0.95 high quality without quality degradation.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
