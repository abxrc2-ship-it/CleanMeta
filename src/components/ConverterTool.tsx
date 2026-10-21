import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Cloud,
  FileCheck,
  Minimize2,
  Scissors,
  Trash2,
  Plus,
  SlidersHorizontal,
  Archive,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { ConversionOptions, ConvertItem, RetentionPreference, ToolType, UserProfile } from '../types';
import { convertImage } from '../lib/converter';
import { formatBytes } from '../lib/imageProcessor';
import { getCleanMetaFilename } from '../lib/naming';
import { uploadToVercelBlob } from '../lib/blobStorage';
import { saveHistoryRecord } from '../lib/firestore';

interface ConverterToolProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSendToTool?: (tool: ToolType, file: File) => void;
}

export const ConverterTool: React.FC<ConverterToolProps> = ({ user, onOpenAuth, onSendToTool }) => {
  // Batch of items to convert
  const [items, setItems] = useState<ConvertItem[]>([]);

  // Universal settings (applied by default to newly added files or all via Apply to All)
  const [universalFormat, setUniversalFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [resizeOption, setResizeOption] = useState<'original' | 'scale75' | 'scale50' | 'custom'>('original');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [retention, setRetention] = useState<RetentionPreference>('none');

  // Processing state
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const appendInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };
  }, []);

  // Add multiple files to converter queue
  const addFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setGlobalError(null);
    const newItems: ConvertItem[] = filesArray.map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        previewUrl,
        targetFormat: universalFormat,
        status: 'queued',
      };
    });

    setItems((prev) => [...prev, ...newItems]);

    // Read dimensions asynchronously
    newItems.forEach((item) => {
      const img = new Image();
      img.onload = () => {
        setItems((current) =>
          current.map((it) =>
            it.id === item.id
              ? { ...it, dimensions: { width: img.naturalWidth, height: img.naturalHeight } }
              : it
          )
        );
      };
      img.src = item.previewUrl;
    });
  };

  const handleInitialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  // Paste support (Ctrl+V) in converter
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleAppendFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  // Remove individual photo from queue
  const handleRemoveItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all items
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setItems([]);
    setGlobalError(null);
    setCloudNotice(null);
  };

  // Change individual target format for a specific photo
  const handleUpdateItemFormat = (id: string, format: 'image/jpeg' | 'image/png' | 'image/webp') => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              targetFormat: format,
              // If already converted, mark as queued so user can re-convert with new format
              status: item.status === 'converted' ? 'queued' : item.status,
            }
          : item
      )
    );
  };

  // Apply universal format to ALL items in queue
  const handleApplyUniversalToAll = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        targetFormat: universalFormat,
        status: item.status === 'converted' ? 'queued' : item.status,
      }))
    );
  };

  // Convert a single item
  const convertSingleItem = async (item: ConvertItem, index: number): Promise<boolean> => {
    try {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'converting', errorMessage: undefined } : i))
      );

      const options: ConversionOptions = {
        targetFormat: item.targetFormat,
        backgroundColor,
        resizeOption,
        customWidth,
        customHeight,
        quality: 0.95,
        index,
      };

      const converted = await convertImage(item.file, options);
      const resultUrl = URL.createObjectURL(converted.blob);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'converted',
                resultBlob: converted.blob,
                resultUrl,
                resultFilename: converted.filename,
                resultSize: converted.blob.size,
              }
            : i
        )
      );

      // Cloud upload and Firestore history save in background (non-blocking)
      (async () => {
        let blobUrl: string | undefined;
        let blobPathname: string | undefined;
        let expiresAt: number | undefined;

        if (retention !== 'none' && user) {
          try {
            const uploadRes = await uploadToVercelBlob(
              converted.blob,
              converted.filename,
              retention,
              'converter'
            );
            if (uploadRes.success) {
              blobUrl = uploadRes.blobUrl;
              blobPathname = uploadRes.blobPathname;
              expiresAt = uploadRes.expiresAt;
            }
          } catch (e: any) {
            console.warn('Converter cloud upload skipped:', e.message);
          }
        }

        if (user) {
          saveHistoryRecord(user.uid, {
            tool: 'converter',
            originalFileName: item.file.name,
            inputFormat: item.file.type || 'unknown',
            outputFormat: converted.outputFormat,
            originalSize: item.file.size,
            processedSize: converted.blob.size,
            status: 'success',
            retention,
            blobUrl,
            blobPathname,
            expiresAt,
          }).catch(() => {});
        }
      })();

      return true;
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                errorMessage: err.message || 'Conversion failed',
              }
            : i
        )
      );
      return false;
    }
  };

  // Convert all queued items
  const handleConvertAll = async () => {
    const pendingItems = items.filter((i) => i.status === 'queued' || i.status === 'error');
    if (pendingItems.length === 0) return;

    try {
      setIsConverting(true);
      setGlobalError(null);
      setCloudNotice(null);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.status === 'queued' || item.status === 'error') {
          await convertSingleItem(item, i);
        }
      }

      if (retention !== 'none' && user) {
        setCloudNotice(`Converted photos scheduled for ${retention} cloud retention.`);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'One or more conversions failed.');
    } finally {
      setIsConverting(false);
    }
  };

  // Download single converted photo
  const handleDownloadSingle = (item: ConvertItem) => {
    if (!item.resultBlob) return;
    const link = document.createElement('a');
    link.href = item.resultUrl || URL.createObjectURL(item.resultBlob);
    link.download = item.resultFilename || getCleanMetaFilename({ mimeType: item.targetFormat });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk download all converted photos as ZIP
  const handleDownloadAllZip = async () => {
    const convertedItems = items.filter((i) => i.status === 'converted' && i.resultBlob);
    if (convertedItems.length === 0) return;

    try {
      setIsZipping(true);
      setZipProgress(0);

      const zip = new JSZip();
      const folder = zip.folder('cleanmeta-converted');

      const usedNames = new Set<string>();

      for (let i = 0; i < convertedItems.length; i++) {
        const item = convertedItems[i];
        let filename = item.resultFilename || getCleanMetaFilename({ mimeType: item.targetFormat, index: i });

        let counter = 1;
        while (usedNames.has(filename)) {
          const dotIdx = filename.lastIndexOf('.');
          const base = dotIdx !== -1 ? filename.slice(0, dotIdx) : filename;
          const ext = dotIdx !== -1 ? filename.slice(dotIdx) : '';
          filename = `${base}_${counter}${ext}`;
          counter++;
        }
        usedNames.add(filename);

        if (folder && item.resultBlob) {
          folder.file(filename, item.resultBlob);
        }

        setZipProgress(Math.round(((i + 1) / convertedItems.length) * 50));
      }

      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (meta) => {
          setZipProgress(50 + Math.round(meta.percent * 0.5));
        }
      );

      const d = new Date();
      const pad2 = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const zipName = `CleanMeta_Converted_${dateStr}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to create ZIP package.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Transfer single converted photo to another tool (e.g. Compressor or BG Remover)
  const handleTransferTo = (tool: ToolType, item: ConvertItem) => {
    if (!item.resultBlob || !onSendToTool) return;
    const newFile = new File([item.resultBlob], item.resultFilename || 'photo.png', {
      type: item.targetFormat,
    });
    onSendToTool(tool, newFile);
  };

  const convertedCount = items.filter((i) => i.status === 'converted').length;
  const queuedCount = items.filter((i) => i.status === 'queued' || i.status === 'error').length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-Image Converter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Batch convert multiple photos simultaneously to JPG, PNG, or WebP with individual per-photo control
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="append-files-input"
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Add More</span>
              </label>
              <input
                id="append-files-input"
                ref={appendInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.heic,.heif"
                onChange={handleAppendFiles}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleClearAll}
                disabled={isConverting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Cloud Notice */}
        {cloudNotice && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>{cloudNotice}</span>
          </div>
        )}

        {/* Empty State / Initial File Picker */}
        {items.length === 0 ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 sm:p-14 cursor-pointer transition text-center bg-slate-50/50 dark:bg-slate-850 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              Select multiple photos to convert
            </span>
            <span className="text-xs text-slate-500 mt-1 max-w-sm">
              Supports JPG, PNG, WebP, and iPhone HEIC. Select 1, 10, or more photos at once.
            </span>
            <span className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition">
              Browse Files (Multiple)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.heic,.heif"
              onChange={handleInitialFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            {/* Universal Conversion Controls Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Universal Settings ({items.length} Photos Selected)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyUniversalToAll}
                  className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                  title="Apply universal target format to all photos in the list"
                >
                  Apply Universal Format to All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Universal Format Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Universal Target Format
                  </label>
                  <select
                    value={universalFormat}
                    onChange={(e) => setUniversalFormat(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="image/jpeg">JPG / JPEG (Universal 95%)</option>
                    <option value="image/png">PNG (Lossless Transparency)</option>
                    <option value="image/webp">WebP (Modern Compact)</option>
                  </select>
                </div>

                {/* Resize Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resolution / Scaling
                  </label>
                  <select
                    value={resizeOption}
                    onChange={(e) => setResizeOption(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="original">Original Dimensions</option>
                    <option value="scale75">75% Resolution</option>
                    <option value="scale50">50% Resolution</option>
                    <option value="custom">Custom Width × Height</option>
                  </select>
                </div>

                {/* Background color for transparent PNG to JPG */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Backdrop Color (For JPG)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-9 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Cloud Retention */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cloud Storage Duration
                  </label>
                  <select
                    value={retention}
                    onChange={(e) => setRetention(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Local Only (অফলাইন - কোনো ক্লাউড নয়)</option>
                    <option value="1day">Cloud: 1 Day (১ দিন)</option>
                    <option value="2days">Cloud: 2 Days (২ দিন)</option>
                    <option value="3days">Cloud: 3 Days (৩ দিন)</option>
                    <option value="4days">Cloud: 4 Days (৪ দিন)</option>
                    <option value="7days">Cloud: 7 Days (৭ দিন)</option>
                    <option value="permanent">Cloud: Permanent (সর্বোচ্চ আনলিমিটেড)</option>
                  </select>
                </div>
              </div>

              {/* Custom Dimensions Input if selected */}
              {resizeOption === 'custom' && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Width:</span>
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 1920)}
                      className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                    <span className="text-xs text-slate-400">px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Height:</span>
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 1080)}
                      className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                    <span className="text-xs text-slate-400">px</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar: Convert All & Bulk Download ZIP */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleConvertAll}
                  disabled={isConverting || queuedCount === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
                    queuedCount === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25'
                  }`}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Converting Photos...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Convert All ({queuedCount})</span>
                    </>
                  )}
                </button>

                {convertedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping || isConverting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>
                      {isZipping ? `Creating ZIP (${zipProgress}%)...` : `Download All as ZIP (${convertedCount})`}
                    </span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {convertedCount} of {items.length} Converted
              </div>
            </div>

            {/* Items List (Supports individual per-item format selection and individual downloads) */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const isConverted = item.status === 'converted';
                const isConvertingThis = item.status === 'converting';
                const isError = item.status === 'error';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all p-3 sm:p-4 bg-white dark:bg-slate-900 ${
                      isConverted
                        ? 'border-emerald-200 dark:border-emerald-900/60 shadow-xs'
                        : isError
                        ? 'border-rose-300 dark:border-rose-900/80'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      {/* Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                          <img
                            src={item.resultUrl || item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.name}
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatBytes(item.size)}</span>
                            {item.dimensions && (
                              <>
                                <span>•</span>
                                <span>{item.dimensions.width}×{item.dimensions.height}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="uppercase text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.type.split('/')[1] || 'IMAGE'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {isConverted ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Ready: {item.resultFilename} ({formatBytes(item.resultSize || 0)})</span>
                              </div>
                            ) : isConvertingThis ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Converting...</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Queued for conversion
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Per-Photo Target Format & Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Format selector for this single photo */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-[11px] text-slate-500 font-semibold mr-1">To:</span>
                          <select
                            value={item.targetFormat}
                            onChange={(e) => handleUpdateItemFormat(item.id, e.target.value as any)}
                            disabled={isConvertingThis}
                            className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="image/jpeg" className="dark:bg-slate-800">JPG</option>
                            <option value="image/png" className="dark:bg-slate-800">PNG</option>
                            <option value="image/webp" className="dark:bg-slate-800">WebP</option>
                          </select>
                        </div>

                        {/* Convert this photo button */}
                        {!isConverted && !isConvertingThis && (
                          <button
                            type="button"
                            onClick={() => convertSingleItem(item, index)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        )}

                        {/* Download Single Converted Photo */}
                        {isConverted && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(item)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Download this single converted photo"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>

                            {/* Transfer to other tools */}
                            {onSendToTool && item.resultBlob && (
                              <button
                                type="button"
                                onClick={() => handleTransferTo('compressor', item)}
                                title="Send to Compressor"
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 text-xs font-bold"
                              >
                                <Minimize2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}

                        {/* Remove this photo button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isConvertingThis}
                          aria-label={`Remove ${item.name} from list`}
                          title="Remove this photo from list"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Error detail */}
                    {isError && item.errorMessage && (
                      <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.errorMessage}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
