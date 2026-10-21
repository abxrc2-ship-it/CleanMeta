import React, { useState, useEffect, useRef } from 'react';
import {
  SplitSquareVertical,
  UploadCloud,
  Columns,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Maximize2,
} from 'lucide-react';
import { formatBytes } from '../lib/imageProcessor';

export const CompareImagesTool: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [urlA, setUrlA] = useState<string | null>(null);
  const [urlB, setUrlB] = useState<string | null>(null);

  const [dimA, setDimA] = useState<{ width: number; height: number } | null>(null);
  const [dimB, setDimB] = useState<{ width: number; height: number } | null>(null);

  const [mode, setMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (urlA) URL.revokeObjectURL(urlA);
      if (urlB) URL.revokeObjectURL(urlB);
    };
  }, [urlA, urlB]);

  const handleSelectA = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileA(f);
      if (urlA) URL.revokeObjectURL(urlA);
      const u = URL.createObjectURL(f);
      setUrlA(u);
      const img = new Image();
      img.src = u;
      img.onload = () => setDimA({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  const handleSelectB = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileB(f);
      if (urlB) URL.revokeObjectURL(urlB);
      const u = URL.createObjectURL(f);
      setUrlB(u);
      const img = new Image();
      img.src = u;
      img.onload = () => setDimB({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  const resetComparison = () => {
    setFileA(null);
    setFileB(null);
    setUrlA(null);
    setUrlB(null);
    setDimA(null);
    setDimB(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <SplitSquareVertical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Compare Images & Quality
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Pixel-accurate split-slider and side-by-side comparison for compression and sharpness.
              </p>
            </div>
          </div>
        </div>

        {fileA && fileB && (
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setMode('slider')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  mode === 'slider' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Split Slider
              </button>
              <button
                onClick={() => setMode('side-by-side')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  mode === 'side-by-side' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Side by Side
              </button>
            </div>
            <button
              onClick={resetComparison}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 hover:bg-rose-100"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {(!fileA || !fileB) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A */}
          <div
            onClick={() => inputRefA.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              fileA
                ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={inputRefA}
              type="file"
              accept="image/*"
              onChange={handleSelectA}
              className="hidden"
            />
            {fileA && urlA ? (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-xl overflow-hidden mb-3 border border-slate-200 dark:border-slate-700">
                  <img src={urlA} alt="A" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs">{fileA.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {dimA ? `${dimA.width}×${dimA.height} px • ` : ''}{formatBytes(fileA.size)}
                </p>
                <span className="mt-2 text-xs text-teal-600 font-semibold">Click to change</span>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Select Image A</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload the first image (Original / Uncompressed)</p>
              </div>
            )}
          </div>

          {/* Card B */}
          <div
            onClick={() => inputRefB.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              fileB
                ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={inputRefB}
              type="file"
              accept="image/*"
              onChange={handleSelectB}
              className="hidden"
            />
            {fileB && urlB ? (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-xl overflow-hidden mb-3 border border-slate-200 dark:border-slate-700">
                  <img src={urlB} alt="B" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs">{fileB.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {dimB ? `${dimB.width}×${dimB.height} px • ` : ''}{formatBytes(fileB.size)}
                </p>
                <span className="mt-2 text-xs text-teal-600 font-semibold">Click to change</span>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Select Image B</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload the second image (Compressed / Modified)</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active Comparison Workspace */
        <div className="flex flex-col gap-6">
          {/* Comparison Viewport */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {mode === 'slider' ? (
              <div className="relative w-full aspect-[16/10] max-h-[550px] rounded-xl bg-slate-950 overflow-hidden select-none">
                {/* Background Image B */}
                <img
                  src={urlB!}
                  alt="Image B"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                />
                {/* Overlay Image A clipped by slider */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={urlA!}
                    alt="Image A"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                    }}
                  />
                </div>

                {/* Vertical Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Invisible slider input over entire view */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-white font-mono text-[11px] backdrop-blur-sm z-10">
                  Image A: {fileA.name} ({dimA?.width}×{dimA?.height})
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 text-white font-mono text-[11px] backdrop-blur-sm z-10">
                  Image B: {fileB.name} ({dimB?.width}×{dimB?.height})
                </div>
              </div>
            ) : (
              /* Side by Side Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-xs text-slate-500 uppercase">Image A</span>
                  <div className="relative aspect-square rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                    <img src={urlA!} alt="A" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span className="truncate max-w-[180px]">{fileA.name}</span>
                    <span>{formatBytes(fileA.size)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-xs text-teal-600 uppercase">Image B</span>
                  <div className="relative aspect-square rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                    <img src={urlB!} alt="B" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span className="truncate max-w-[180px]">{fileB.name}</span>
                    <span>{formatBytes(fileB.size)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-semibold">Slider: {sliderPos}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                  className="w-32 accent-teal-600"
                />
              </div>

              {/* Difference Stats */}
              <div className="flex items-center gap-4 font-mono">
                {fileA && fileB && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Size Delta:</span>
                    <span className={fileA.size > fileB.size ? 'text-emerald-600 font-bold' : 'text-rose-600'}>
                      {fileA.size > fileB.size
                        ? `-${Math.round(((fileA.size - fileB.size) / fileA.size) * 100)}% (${formatBytes(fileA.size - fileB.size)} smaller)`
                        : `+${Math.round(((fileB.size - fileA.size) / fileA.size) * 100)}% (${formatBytes(fileB.size - fileA.size)} larger)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
