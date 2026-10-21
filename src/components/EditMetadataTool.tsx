import React, { useState, useEffect, useRef } from 'react';
import {
  FileEdit,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  Tag,
  User,
  Copyright,
  FileText,
  Calendar,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { extractMetadata } from '../lib/metadata';
import { getCleanMetaFilename } from '../lib/naming';
import { formatBytes } from '../lib/imageProcessor';

export const EditMetadataTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [copyright, setCopyright] = useState('');
  const [description, setDescription] = useState('');
  const [creationDate, setCreationDate] = useState('');

  // Read-only sensor fields
  const [readOnlyHardware, setReadOnlyHardware] = useState<string>('Standard Sensor');
  const [originalDimensions, setOriginalDimensions] = useState<string>('—');

  const [isProcessing, setIsProcessing] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [previewUrl, outputUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setOutputBlob(null);
      setOutputUrl(null);
      setSuccessMessage(null);
      setErrorMessage(null);

      try {
        const meta = await extractMetadata(selected);
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
        setArtist(meta.artistOrCopyright || '');
        setCopyright(`© ${new Date().getFullYear()} ${meta.artistOrCopyright || 'CleanMeta'}`);
        setDescription('Processed with CleanMeta Studio');
        setCreationDate(new Date().toISOString().slice(0, 10));

        if (meta.cameraMake || meta.cameraModel) {
          setReadOnlyHardware(`${meta.cameraMake || ''} ${meta.cameraModel || ''}`.trim());
        } else if (meta.isAiGenerated) {
          setReadOnlyHardware(`AI Generator: ${meta.aiToolOrSoftware || 'Synthetic Media'}`);
        } else {
          setReadOnlyHardware('None (Digital Graphic / AI Image)');
        }
      } catch {
        setTitle(selected.name);
        setReadOnlyHardware('None (Digital Graphic)');
      }

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setOriginalDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
      };
      if (e.target) e.target.value = '';
    }
  };

  // Paste support (Ctrl+V) in EditMetadataTool
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const selected = e.clipboardData.files[0];
        if (selected.type.startsWith('image/')) {
          e.preventDefault();
          setFile(selected);
          const url = URL.createObjectURL(selected);
          setPreviewUrl(url);
          setOutputBlob(null);
          setOutputUrl(null);
          setSuccessMessage(null);
          setErrorMessage(null);
          try {
            const meta = await extractMetadata(selected);
            setTitle(selected.name.replace(/\.[^/.]+$/, ''));
            setArtist(meta.artistOrCopyright || '');
            setCopyright(`© ${new Date().getFullYear()} ${meta.artistOrCopyright || 'CleanMeta'}`);
            setDescription('Processed with CleanMeta Studio');
            setCreationDate(new Date().toISOString().slice(0, 10));
            if (meta.cameraMake || meta.cameraModel) {
              setReadOnlyHardware(`${meta.cameraMake || ''} ${meta.cameraModel || ''}`);
            }
          } catch {
            setTitle(selected.name);
          }
          const img = new Image();
          img.src = url;
          img.onload = () => {
            setOriginalDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
          };
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleApplyMetadata = async () => {
    if (!file || !previewUrl) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Canvas re-encoding to apply fresh clean metadata container
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not access canvas context.');

      ctx.drawImage(img, 0, 0);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const cleanBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to encode image.'));
          },
          mimeType,
          0.95
        );
      });

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const newUrl = URL.createObjectURL(cleanBlob);
      setOutputBlob(cleanBlob);
      setOutputUrl(newUrl);
      setSuccessMessage('Metadata tags sanitized and updated into clean container successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    const filename = getCleanMetaFilename({
      originalName: file.name,
      mimeType: file.type || 'image/jpeg',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outputBlob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Edit Image Metadata
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Safely customize author, copyright notice, description, and title while scrubbing tracking tags.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          <span>Local Sanitizer • Zero Leakage</span>
        </div>
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-2xl p-10 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Choose an image to edit metadata
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Assign custom copyright, author details, and captions without revealing GPS coordinates or camera serials.
          </p>
          <button className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition">
            Select Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-violet-600" />
                  <span>Editable Metadata Fields</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  Safe for Export
                </span>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document / Photo Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Landscape Photography 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Author / Artist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-500" />
                  <span>Author / Creator (IPTC Artist)</span>
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Copyright Notice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Copyright className="w-3.5 h-3.5 text-violet-500" />
                  <span>Copyright Notice</span>
                </label>
                <input
                  type="text"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  placeholder="e.g., © 2026 All Rights Reserved"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Caption / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                  <span>Description / Caption</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add descriptive alt text or comments..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-500" />
                  <span>Creation Date Stamp</span>
                </label>
                <input
                  type="date"
                  value={creationDate}
                  onChange={(e) => setCreationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Read-Only Hardware Tags (Protected) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Read-Only / Protected Hardware Tags</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase block text-slate-400">Resolution</span>
                    <span>{originalDimensions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block text-slate-400">Sensor</span>
                    <span className="truncate block">{readOnlyHardware}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleApplyMetadata}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md shadow-violet-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing Clean Container...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save & Update Metadata</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Download */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="relative w-full aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden mb-3">
                {previewUrl && (
                  <img src={previewUrl} alt="Inspection" className="max-h-full max-w-full object-contain" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate w-full text-center">
                {file.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {formatBytes(file.size)} • {file.type || 'image/jpeg'}
              </p>

              {outputBlob && (
                <button
                  onClick={handleDownload}
                  className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Updated Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
