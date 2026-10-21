import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Download,
  CheckCircle2,
  AlertCircle,
  Cloud,
  FileCheck,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  Maximize,
} from 'lucide-react';
import { CompressionOptions, RetentionPreference, ToolType, UserProfile } from '../types';
import { compressImage, CompressImageResult } from '../lib/compressor';
import { formatBytes } from '../lib/imageProcessor';
import { uploadToVercelBlob } from '../lib/blobStorage';
import { saveHistoryRecord } from '../lib/firestore';

interface CompressorToolProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSendToTool?: (tool: ToolType, file: File) => void;
}

export const CompressorTool: React.FC<CompressorToolProps> = ({
  user,
  onOpenAuth,
  onSendToTool,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Settings
  const [mode, setMode] = useState<'preset' | 'target'>('preset');
  const [preset, setPreset] = useState<'high' | 'balanced' | 'small'>('balanced');
  const [targetSizeVal, setTargetSizeVal] = useState<number>(500);
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [allowResize, setAllowResize] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [retention, setRetention] = useState<RetentionPreference>('none');

  // Processing state
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressImageResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);

      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;

      if (selected.type.includes('png')) setOutputFormat('image/png');
      else if (selected.type.includes('webp')) setOutputFormat('image/webp');
      else setOutputFormat('image/jpeg');
    }
    if (e.target) e.target.value = '';
  };

  // Paste support (Ctrl+V) in CompressorTool
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const selected = e.clipboardData.files[0];
        if (selected.type.startsWith('image/')) {
          e.preventDefault();
          setFile(selected);
          setError(null);
          setResult(null);
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          setResultUrl(null);
          const url = URL.createObjectURL(selected);
          setPreviewUrl(url);
          const img = new Image();
          img.onload = () => {
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          };
          img.src = url;
          if (selected.type.includes('png')) setOutputFormat('image/png');
          else if (selected.type.includes('webp')) setOutputFormat('image/webp');
          else setOutputFormat('image/jpeg');
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [resultUrl]);

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsCompressing(true);
      setError(null);
      setCloudNotice(null);

      const targetKB = targetSizeUnit === 'MB' ? targetSizeVal * 1024 : targetSizeVal;

      const options: CompressionOptions = {
        mode,
        preset,
        targetSizeKB: targetKB,
        allowResize,
        outputFormat,
      };

      const compressed = await compressImage(file, options);
      const url = URL.createObjectURL(compressed.blob);
      setResult(compressed);
      setResultUrl(url);

      // Asynchronously handle cloud upload & history save in background
      (async () => {
        let blobUrl: string | undefined;
        let blobPathname: string | undefined;
        let expiresAt: number | undefined;

        if (retention !== 'none' && user) {
          try {
            const uploadRes = await uploadToVercelBlob(compressed.blob, compressed.filename, retention, 'compressor');
            if (uploadRes.success) {
              blobUrl = uploadRes.blobUrl;
              blobPathname = uploadRes.blobPathname;
              expiresAt = uploadRes.expiresAt;
              setCloudNotice(`Saved to Cloud for ${retention}.`);
            } else if (uploadRes.error) {
              setCloudNotice(uploadRes.error);
            }
          } catch (e: any) {
            console.warn('Cloud upload notice:', e.message);
          }
        }

        if (user) {
          saveHistoryRecord(user.uid, {
            tool: 'compressor',
            originalFileName: file.name,
            inputFormat: file.type || 'unknown',
            outputFormat,
            originalSize: file.size,
            processedSize: compressed.outputSize,
            status: 'success',
            retention,
            blobUrl,
            blobPathname,
            expiresAt,
          }).catch(() => {});
        }
      })();
    } catch (err: any) {
      setError(err.message || 'Image compression failed.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = resultUrl || URL.createObjectURL(result.blob);
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTransferTo = (tool: ToolType) => {
    if (!result || !file || !onSendToTool) return;
    const newFile = new File([result.blob], result.filename, {
      type: outputFormat,
    });
    onSendToTool(tool, newFile);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <Minimize2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Smart Image Compressor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reduce file size dramatically with quality presets or exact target size optimization
            </p>
          </div>
        </div>

        {/* File Picker */}
        {!file ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 sm:p-12 cursor-pointer transition text-center bg-slate-50/50 dark:bg-slate-850">
            <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              Select photo to compress
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports JPG, PNG, WebP, and iPhone HEIC (Max 25 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.heic,.heif"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            {/* File Info Card */}
            <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Original: <strong className="text-slate-700 dark:text-slate-200">{formatBytes(file.size)}</strong>
                    {dimensions && ` • ${dimensions.width}×${dimensions.height} px`}
                  </p>
                </div>
              </div>
              <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Change File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.heic,.heif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('preset')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'preset'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Quality Presets
              </button>
              <button
                type="button"
                onClick={() => setMode('target')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'target'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Target File Size
              </button>
            </div>

            {/* Controls depending on mode */}
            {mode === 'preset' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreset('high')}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    preset === 'high'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">High Quality</p>
                  <p className="text-[11px] text-slate-500 mt-1">90% quality factor. Maximum visual clarity.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('balanced')}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    preset === 'balanced'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Balanced</p>
                  <p className="text-[11px] text-slate-500 mt-1">75% quality factor. Great web balance.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('small')}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    preset === 'small'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Smaller File</p>
                  <p className="text-[11px] text-slate-500 mt-1">50% quality factor. High compression ratio.</p>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Size Limit
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="number"
                    min="10"
                    value={targetSizeVal}
                    onChange={(e) => setTargetSizeVal(Math.max(1, parseInt(e.target.value, 10) || 100))}
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                  <select
                    value={targetSizeUnit}
                    onChange={(e: any) => setTargetSizeUnit(e.target.value)}
                    className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowResize}
                    onChange={(e) => setAllowResize(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Allow automatic dimension scaling if compression alone cannot meet target</span>
                </label>
              </div>
            )}

            {/* Retention Selector (Min 1 day, max 4 days) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Storage Option (Online / Offline)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Local Only operates 100% offline; Cloud keeps file temporarily
                  </p>
                </div>
              </div>

              <select
                value={retention}
                onChange={(e: any) => {
                  if (e.target.value !== 'none' && !user) {
                    onOpenAuth();
                  } else {
                    setRetention(e.target.value);
                  }
                }}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="none">Local Only (100% Offline RAM)</option>
                <option value="1day">Cloud: 1 Day</option>
                <option value="2days">Cloud: 2 Days</option>
                <option value="3days">Cloud: 3 Days</option>
                <option value="4days">Cloud: 4 Days</option>
                <option value="7days">Cloud: 7 Days</option>
                <option value="permanent">Cloud: Permanent</option>
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCompressing ? (
                <>
                  <Minimize2 className="w-4 h-4 animate-spin" />
                  <span>Compressing Photo...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Compress Photo Now</span>
                </>
              )}
            </button>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Cloud Notice */}
            {cloudNotice && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{cloudNotice}</span>
              </div>
            )}

            {/* Result Box */}
            {result && resultUrl && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                      Compression Complete!
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="line-through text-slate-500">{formatBytes(result.originalSize)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {formatBytes(result.outputSize)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                      -{result.reductionPercentage}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  {result.message}
                </p>

                <div className="rounded-xl overflow-hidden max-h-72 bg-slate-900 flex items-center justify-center">
                  <img
                    src={resultUrl}
                    alt="Compressed output"
                    className="max-h-72 w-auto max-w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed Photo</span>
                  </button>

                  {onSendToTool && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleTransferTo('converter')}
                        className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Convert</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransferTo('image-resizer')}
                        className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Maximize className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resize</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
