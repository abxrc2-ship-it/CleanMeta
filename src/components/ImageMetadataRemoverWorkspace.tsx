import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Download,
  FolderArchive,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  MapPin,
  Camera,
  Calendar,
  Layers,
  Check,
  Copy,
  Info,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Sparkles,
  Bot,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  HardDrive,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { PhotoItem, CleanFormatPreference, RetentionPreference, UserProfile } from '../types';
import { formatBytes, processAndCleanImage } from '../lib/imageProcessor';
import { getCleanMetaFilename } from '../lib/naming';
import { saveFileToCloudVault } from '../lib/cloudVaultManager';
import { getRemainingOperations, incrementDailyUsage } from '../lib/dailyLimits';

interface ImageMetadataRemoverWorkspaceProps {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onClearQueue: () => void;
  onDownloadZip: () => void;
  formatPreference: CleanFormatPreference;
  onChangeFormatPreference: (format: CleanFormatPreference) => void;
  retentionPreference: RetentionPreference;
  onChangeRetentionPreference: (retention: RetentionPreference) => void;
  user?: UserProfile | null;
  onNavigate?: (tab: any) => void;
  storageMode?: 'local' | 'cloud';
  onToggleStorageMode?: () => void;
}

export const ImageMetadataRemoverWorkspace: React.FC<ImageMetadataRemoverWorkspaceProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onClearQueue,
  onDownloadZip,
  formatPreference,
  onChangeFormatPreference,
  retentionPreference,
  onChangeRetentionPreference,
  user,
  onNavigate,
  storageMode = 'local',
  onToggleStorageMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'cleaned'>('original');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [copiedGps, setCopiedGps] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [cloudSavedNotice, setCloudSavedNotice] = useState<string | null>(null);

  // Inspector checkboxes
  const [stripGps, setStripGps] = useState(true);
  const [stripCamera, setStripCamera] = useState(true);
  const [preserveCreator, setPreserveCreator] = useState(false);
  const [stripSoftware, setStripSoftware] = useState(true);
  const [stripThumbnail, setStripThumbnail] = useState(true);
  const [preserveOrientation, setPreserveOrientation] = useState(true);
  const [autoRenameHash, setAutoRenameHash] = useState(true);

  // Demo fallback image (ONLY shown if user explicitly clicks "Try Sample Photo")
  const defaultSamplePhoto: PhotoItem = {
    id: 'sample-alpine-demo',
    file: new File([''], 'Sample_Camera_Photo_GPS.jpg', { type: 'image/jpeg' }),
    name: 'Sample_Camera_Photo_GPS.jpg',
    size: 3840000,
    type: 'image/jpeg',
    originalUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    dimensions: { width: 4032, height: 3024 },
    status: 'queued',
    originalMetadata: {
      hasGps: true,
      gpsLatitude: 37.7749,
      gpsLongitude: -122.4194,
      gpsAltitude: 1842,
      cameraMake: 'Apple',
      cameraModel: 'iPhone 15 Pro',
      dateTimeOriginal: '2024:10:14 14:28:09',
      software: 'Adobe Photoshop Lightroom 13.2',
      lensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
      iso: '80',
      shutterSpeed: '1/125s',
      fNumber: 'f/1.78',
      allTagsCount: 12,
      tagList: [
        { name: 'GPSLatitude', value: '37.7749° N', category: 'GPS' },
        { name: 'GPSLongitude', value: '122.4194° W', category: 'GPS' },
        { name: 'GPSAltitude', value: '1,842m AMSL', category: 'GPS' },
        { name: 'Make', value: 'Apple', category: 'Camera' },
        { name: 'Model', value: 'iPhone 15 Pro', category: 'Camera' },
        { name: 'LensModel', value: '24mm f/1.78', category: 'Camera' },
        { name: 'DateTimeOriginal', value: '2024:10:14 14:28:09', category: 'Date' },
        { name: 'Software', value: 'Adobe Photoshop Lightroom 13.2', category: 'Software' },
        { name: 'ISOSpeedRatings', value: '80', category: 'Camera' },
        { name: 'FNumber', value: 'f/1.78', category: 'Camera' },
      ],
    },
  };

  // Only use real user photos unless user explicitly turned on demo
  const currentPhotos = photos.length > 0 ? photos : showDemo ? [defaultSamplePhoto] : [];

  // When user uploads real photos, automatically turn off demo
  useEffect(() => {
    if (photos.length > 0 && showDemo) {
      setShowDemo(false);
    }
  }, [photos.length, showDemo]);

  // Select first photo by default or update if list changes
  useEffect(() => {
    if (photos.length > 0) {
      if (!selectedPhotoId || !photos.some((p) => p.id === selectedPhotoId)) {
        setSelectedPhotoId(photos[0].id);
      }
    } else if (showDemo) {
      setSelectedPhotoId(defaultSamplePhoto.id);
    } else {
      setSelectedPhotoId(null);
    }
  }, [photos, showDemo]);

  const activePhoto =
    currentPhotos.find((p) => p.id === selectedPhotoId) || (currentPhotos.length > 0 ? currentPhotos[0] : null);

  // Clean / Clear All Reset handler (Explicit user request)
  const handleCleanAll = () => {
    setShowDemo(false);
    setSelectedPhotoId(null);
    onClearQueue();
  };

  // Global paste handler inside this workspace
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.clipboardData?.items) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              const ext = item.type.split('/')[1] || 'png';
              const file = new File([blob], `pasted-${Date.now()}-${i + 1}.${ext}`, {
                type: item.type,
              });
              imageFiles.push(file);
            }
          }
        }
        if (imageFiles.length > 0) {
          e.preventDefault();
          onAddPhotos(imageFiles);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onAddPhotos]);

  // Clean the active photo
  const handleProcessActive = async () => {
    if (!activePhoto) return;

    // Daily limit check
    const limits = getRemainingOperations(storageMode);
    if (limits.isExceeded) {
      alert(
        `Daily operation limit reached (${limits.limit} photos). Redeem a Pro voucher to unlock higher quota or try again tomorrow.`
      );
      return;
    }

    setIsProcessing(true);

    try {
      if (activePhoto.file && activePhoto.file.size > 0) {
        const result = await processAndCleanImage(activePhoto.file, {
          formatPreference,
        });

        activePhoto.cleanedBlob = result.blob;
        activePhoto.cleanedSize = result.blob.size;
        activePhoto.status = 'cleaned';
        activePhoto.cleanedUrl = URL.createObjectURL(result.blob);

        // Strict No-Save check: if user chose 'none' (or is local), NEVER save to cloud
        if (retentionPreference !== 'none' && storageMode === 'cloud') {
          await saveFileToCloudVault(
            result.blob,
            activePhoto.name,
            retentionPreference,
            'Image Privacy Scrubber',
            user?.uid
          );
          setCloudSavedNotice(`Saved to Vault with ${retentionPreference} auto-clean retention`);
          setTimeout(() => setCloudSavedNotice(null), 4000);
        }

        incrementDailyUsage(storageMode, 1);
      } else {
        // Fallback for demo sample photo
        activePhoto.status = 'cleaned';
        activePhoto.cleanedUrl = activePhoto.originalUrl;
      }
      setActiveTab('cleaned');
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Clean All Photos
  const handleProcessAllBulk = async () => {
    if (currentPhotos.length === 0) return;

    const limits = getRemainingOperations(storageMode);
    if (limits.isExceeded) {
      alert(
        `Daily operation limit reached (${limits.limit} photos). Redeem a Pro voucher to unlock higher quota or try again tomorrow.`
      );
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: currentPhotos.length });

    for (let i = 0; i < currentPhotos.length; i++) {
      const p = currentPhotos[i];
      setBulkProgress({ current: i + 1, total: currentPhotos.length });
      try {
        if (p.file && p.file.size > 0) {
          p.status = 'processing';
          const result = await processAndCleanImage(p.file, { formatPreference });
          p.cleanedBlob = result.blob;
          p.cleanedSize = result.blob.size;
          p.status = 'cleaned';
          p.cleanedUrl = URL.createObjectURL(result.blob);

          if (retentionPreference !== 'none' && storageMode === 'cloud') {
            await saveFileToCloudVault(
              result.blob,
              p.name,
              retentionPreference,
              'Bulk Image Scrubber',
              user?.uid
            );
          }
        } else {
          p.status = 'cleaned';
          p.cleanedUrl = p.originalUrl;
        }
      } catch (err) {
        console.error(`Error cleaning ${p.name}:`, err);
        p.status = 'error';
      }
    }

    setIsBulkProcessing(false);
    incrementDailyUsage(storageMode, currentPhotos.length);

    if (retentionPreference !== 'none' && storageMode === 'cloud') {
      setCloudSavedNotice(
        `Saved all ${currentPhotos.length} files to Cloud Vault with ${retentionPreference} auto-clean timers.`
      );
      setTimeout(() => setCloudSavedNotice(null), 4000);
    }
    if (activePhoto?.status === 'cleaned') {
      setActiveTab('cleaned');
    }
  };

  const handleDownloadActiveClean = () => {
    if (!activePhoto) return;
    const blobToDownload = activePhoto.cleanedBlob || new Blob(['clean'], { type: 'image/jpeg' });
    const ext = formatPreference === 'auto' ? 'jpg' : formatPreference;
    const filename = getCleanMetaFilename(activePhoto.name || 'photo.jpg', ext);

    const url = URL.createObjectURL(blobToDownload);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Helper values for active photo
  const meta = activePhoto?.originalMetadata;
  const hasGps = Boolean(meta?.hasGps && meta?.gpsLatitude !== undefined && meta?.gpsLongitude !== undefined);
  const isAi = Boolean(meta?.isAiGenerated);
  const cameraName = meta?.cameraModel || meta?.cameraMake ? `${meta.cameraMake || ''} ${meta.cameraModel || ''}`.trim() : null;
  const softwareName = meta?.software;
  const tagsCount = meta?.tagList?.length ?? 0;

  return (
    <div className="w-full flex flex-col gap-5 text-left pb-16">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddPhotos(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Breadcrumb & Telemetry Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
          <span className="font-semibold text-blue-600 dark:text-cyan-400">Image Tools</span>
          <span>›</span>
          <span className="text-slate-900 dark:text-white font-medium">
            Metadata Remover &amp; Privacy Scrubber
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleStorageMode}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition cursor-pointer hover:scale-105 ${
            storageMode === 'local'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
          title="Click to toggle Local Sandbox vs Web Server 1 GB"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                storageMode === 'local' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                storageMode === 'local' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span>
            {storageMode === 'local'
              ? 'Local Sandbox (Green) • 100% In-Browser RAM'
              : 'Web Server (Red) • Vercel 1 GB Cloud Vault (3h–2d Auto-Purge)'}
          </span>
        </button>
      </div>

      {/* Header Row with Stat Counters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-neutral-800 text-blue-700 dark:text-cyan-400 font-mono text-[10px] font-bold">
              EXIF / XMP / IPTC
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-mono text-[10px] font-semibold">
              Lossless Bulk Sanitizer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Image Metadata Remover &amp; Privacy Scrubber
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Wipe camera model, GPS coordinates, capture date, serial numbers, AI prompts, and editing history
            before sharing photos publicly.
          </p>
        </div>

        {/* Action Controls (Responsive: Full width buttons on phone) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photos (Bulk)</span>
          </button>

          {currentPhotos.length > 1 && (
            <button
              onClick={handleProcessAllBulk}
              disabled={isBulkProcessing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isBulkProcessing
                  ? `Scrubbing (${bulkProgress.current}/${bulkProgress.total})...`
                  : `Scrub All ${currentPhotos.length} Photos`}
              </span>
            </button>
          )}

          {currentPhotos.length > 0 && (
            <button
              onClick={handleCleanAll}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Purge all uploaded images and reset workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean / Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Saved Notification */}
      {cloudSavedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{cloudSavedNotice}</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('my-files')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Vault</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ZERO IMAGES LOADED: Clean, Click-Anywhere Dropzone */}
      {/* ============================================================== */}
      {currentPhotos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 sm:p-20 rounded-3xl border-2 border-dashed border-slate-300 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-[#0a0a0a] text-center cursor-pointer flex flex-col items-center justify-center gap-4 transition shadow-xs hover:shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
              Click anywhere or drag &amp; drop photos here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
              Wipe EXIF, GPS location coordinates, camera serials, and AI generation prompts locally in RAM.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 font-medium">
              JPG, PNG, WebP up to 50MB (Bulk Supported)
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
              Ctrl+V to paste anytime
            </span>
          </div>

          {/* Optional Demo Button - ONLY loads when explicitly clicked */}
          <div className="pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDemo(true);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-2"
            >
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Load Sample Demo Photo (For Testing Only)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* IMAGES LOADED: Full Workspace with Inspector & Batch Queue */
        /* ============================================================== */
        <div className="flex flex-col gap-5">
          {/* Demo Mode Notice Banner if using demo photo */}
          {showDemo && (
            <div className="p-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">
                  Sample Demo Photo Active for testing. Upload your own image or click Clean to start fresh.
                </span>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 font-bold text-xs transition cursor-pointer"
              >
                ✕ Remove Demo
              </button>
            </div>
          )}

          {/* AUTHENTIC Privacy Assessment Card (Tailored to actual image findings!) */}
          {hasGps ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                      High Privacy Risk: GPS Location Found
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold uppercase">
                      EXPOSED
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 dark:text-rose-300 mt-1 leading-relaxed">
                    Precise physical coordinates embedded in EXIF:{' '}
                    <strong className="underline decoration-rose-500">
                      {meta?.gpsLatitude?.toFixed(4)}°, {meta?.gpsLongitude?.toFixed(4)}°
                    </strong>
                    {meta?.gpsAltitude !== undefined && ` (${Math.round(meta.gpsAltitude)}m altitude)`}.
                    Scrubbing will permanently eliminate this geographic tracking data.
                  </p>
                </div>
              </div>
            </div>
          ) : isAi ? (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                      AI Generated Image Detected
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-extrabold uppercase">
                      SYNTHETIC MEDIA
                    </span>
                  </div>
                  <p className="text-xs text-purple-800/90 dark:text-purple-300 mt-1 leading-relaxed">
                    Generated via{' '}
                    <strong className="font-bold">{meta?.aiToolOrSoftware || 'AI Engine'}</strong>. No physical camera
                    hardware or GPS location exists. {meta?.aiPromptSnippet ? `Prompt metadata detected: "${meta.aiPromptSnippet.slice(0, 80)}..."` : 'Scrubbing will remove all generation parameters, software signatures, and watermarks.'}
                  </p>
                </div>
              </div>
            </div>
          ) : cameraName ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                      Camera Device Fingerprint Found
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold uppercase">
                      DEVICE EXPOSURE
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300 mt-1 leading-relaxed">
                    Camera Hardware: <strong className="font-bold">{cameraName}</strong>. No GPS location found.
                    Capture date, shutter speed, and lens specifications will be scrubbed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      Safe / No Physical Tracking Detected
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                      SAFE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300 mt-1 leading-relaxed">
                    No physical GPS coordinates or camera serials are embedded. Re-encoding this image will strip any
                    residual format tags or color profiles for maximum privacy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Batch Queue Strip */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Batch Queue
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-xs font-semibold">
                  {currentPhotos.length} Files
                </span>
                {currentPhotos.some((p) => p.status === 'cleaned') && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {currentPhotos.filter((p) => p.status === 'cleaned').length} Cleaned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>

                <button
                  onClick={handleCleanAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable File Cards Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {currentPhotos.map((p) => {
                const isSelected = p.id === activePhoto?.id;
                const pMeta = p.originalMetadata;
                const pHasGps = Boolean(pMeta?.hasGps);
                const pIsAi = Boolean(pMeta?.isAiGenerated);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPhotoId(p.id)}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer shrink-0 max-w-[220px] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-neutral-800 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#111111] hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 relative">
                      <img
                        src={p.originalUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>{formatBytes(p.size)}</span>
                        <span>•</span>
                        {pHasGps ? (
                          <span className="text-rose-500 font-bold">GPS</span>
                        ) : pIsAi ? (
                          <span className="text-purple-500 font-bold">AI</span>
                        ) : (
                          <span className="text-slate-400">Image</span>
                        )}
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            p.status === 'cleaned' ? 'text-emerald-600 font-bold' : 'text-amber-500'
                          }`}
                        >
                          {p.status === 'cleaned' ? 'Clean' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Delete item button (✕) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.id === 'sample-alpine-demo') {
                          setShowDemo(false);
                        } else {
                          onRemovePhoto(p.id);
                        }
                      }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-300 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Inspection Area: Split 7:5 (Preview vs Inspector) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: Visual Preview Canvas (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3">
                {/* Visual Tab Selector */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab('original')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeTab === 'original'
                          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setActiveTab('cleaned')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'cleaned'
                          ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <span>Sanitized</span>
                      {activePhoto?.status === 'cleaned' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center cursor-pointer"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Canvas Preview Area */}
                <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner group">
                  {activePhoto && (
                    <>
                      <img
                        src={
                          activeTab === 'cleaned' && activePhoto.cleanedUrl
                            ? activePhoto.cleanedUrl
                            : activePhoto.originalUrl
                        }
                        alt={activePhoto.name}
                        style={{ transform: `scale(${zoomLevel})` }}
                        className="max-w-full max-h-full object-contain transition-transform duration-150"
                      />

                      {/* Top Overlay Banner (DYNAMIC based on real image analysis) */}
                      {activeTab === 'original' && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-slate-700/60 shadow-lg">
                          {hasGps ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              <span className="text-rose-300">EMBEDDED GPS LOCATION DETECTED</span>
                            </>
                          ) : isAi ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-purple-400" />
                              <span className="text-purple-300">AI GENERATED MEDIA DETECTED</span>
                            </>
                          ) : tagsCount > 0 ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-amber-300">{tagsCount} METADATA TAGS DETECTED</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-emerald-300">CLEAN IMAGE — NO EXIF DETECTED</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Desktop Bottom Metadata Pill (Hidden on phone screens to prevent image obstruction!) */}
                      <div className="hidden sm:flex absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs items-center justify-between gap-2 border border-slate-700/60">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Original File</p>
                          <p className="font-bold text-xs truncate max-w-[170px]">
                            {activePhoto.name}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Dimensions</p>
                          <p className="font-bold text-xs">
                            {activePhoto.dimensions?.width && activePhoto.dimensions?.height
                              ? `${activePhoto.dimensions.width} × ${activePhoto.dimensions.height}`
                              : 'Auto'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">
                            {isAi ? 'AI Generator' : 'Hardware'}
                          </p>
                          <p className="font-bold text-xs truncate max-w-[160px]">
                            {cameraName
                              ? cameraName
                              : isAi
                              ? meta?.aiToolOrSoftware || 'AI Generated'
                              : softwareName
                              ? softwareName
                              : 'None (Digital Image)'}
                          </p>
                        </div>

                        {/* Location: Shows real coordinates IF present, otherwise Safe badge */}
                        {hasGps ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-mono font-bold">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>
                              {meta?.gpsLatitude?.toFixed(4)}°, {meta?.gpsLongitude?.toFixed(4)}°
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>No GPS (Private)</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile Metadata Pill (Rendered cleanly beneath canvas so phone users can view entire photo!) */}
                {activePhoto && (
                  <div className="sm:hidden p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">File</p>
                      <p className="font-bold text-xs truncate">{activePhoto.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Dimensions</p>
                      <p className="font-bold text-xs">
                        {activePhoto.dimensions?.width && activePhoto.dimensions?.height
                          ? `${activePhoto.dimensions.width} × ${activePhoto.dimensions.height}`
                          : 'Auto'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">{isAi ? 'AI Engine' : 'Hardware'}</p>
                      <p className="font-bold text-xs truncate">
                        {cameraName || (isAi ? meta?.aiToolOrSoftware || 'AI' : 'None')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Location</p>
                      <p className="font-bold text-xs truncate">
                        {hasGps ? `${meta?.gpsLatitude?.toFixed(2)}°, ${meta?.gpsLongitude?.toFixed(2)}°` : 'No GPS (Safe)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary Action Button Suite (Responsive: Stacks on mobile) */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    onClick={handleProcessActive}
                    disabled={isProcessing}
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>{isProcessing ? 'Scrubbing Metadata...' : 'Scrub & Clean This Photo'}</span>
                  </button>

                  {activePhoto?.status === 'cleaned' && (
                    <button
                      onClick={handleDownloadActiveClean}
                      className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Cleaned</span>
                    </button>
                  )}

                  {currentPhotos.length > 1 && (
                    <button
                      onClick={onDownloadZip}
                      className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-neutral-700 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FolderArchive className="w-4 h-4" />
                      <span>Download All (ZIP)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Metadata Tag Inspector & Retention Controls (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* CLOUD RETENTION POLICY SELECTOR (Min 3h to Max 2 Days per user request) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      Cloud Vault &amp; Auto-Purge
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold">
                    Vercel 1 GB
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  How long should CleanMeta hold your processed file before automated self-destruction?
                </p>

                {/* Retention Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'none', label: '0h (Incognito)', hint: 'Wipe on close' },
                    { id: '3hours', label: '3 Hours (Min)', hint: 'Quick Cache' },
                    { id: '6hours', label: '6 Hours', hint: 'Half day' },
                    { id: '12hours', label: '12 Hours', hint: 'Work day' },
                    { id: '24hours', label: '24 Hours', hint: '1 Day' },
                    { id: '48hours', label: '2 Days (Max)', hint: 'Pro Vault' },
                  ].map((opt) => {
                    const isSelected = retentionPreference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeRetentionPreference(opt.id as RetentionPreference)}
                        className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-500/50'
                            : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-[11px] block">{opt.label}</span>
                        <span className="text-[9px] text-slate-400 font-normal">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-neutral-800">
                  <span className="text-slate-500 dark:text-neutral-400">
                    {retentionPreference === 'none'
                      ? 'Incognito: 0 bytes retained on servers'
                      : `Auto-purge timer: Cleans in ${retentionPreference.replace('hours', ' hours').replace('48hours', '2 days')}`}
                  </span>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('my-files')}
                      className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                    >
                      Open Vault →
                    </button>
                  )}
                </div>
              </div>

              {/* Sanitization Checklist */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      Sanitization Rules
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Ready to Scrub
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Wipe GPS Lat / Long / Altitude
                    </span>
                    <input
                      type="checkbox"
                      checked={stripGps}
                      onChange={(e) => setStripGps(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Remove Hardware Make &amp; Model
                    </span>
                    <input
                      type="checkbox"
                      checked={stripCamera}
                      onChange={(e) => setStripCamera(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Strip Software &amp; AI Prompts
                    </span>
                    <input
                      type="checkbox"
                      checked={stripSoftware}
                      onChange={(e) => setStripSoftware(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Remove Embedded Thumbnail Streams
                    </span>
                    <input
                      type="checkbox"
                      checked={stripThumbnail}
                      onChange={(e) => setStripThumbnail(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </label>
                </div>

                {/* Detected Tag Inspector List */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Discovered Metadata Tags ({tagsCount})
                    </span>
                    {hasGps && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                        GPS Active
                      </span>
                    )}
                  </div>

                  {tagsCount > 0 ? (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {meta?.tagList?.map((tag, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 text-xs flex items-center justify-between font-mono"
                        >
                          <span className="text-slate-500 dark:text-neutral-400">{tag.name}</span>
                          <span className="font-bold text-slate-800 dark:text-white truncate max-w-[170px]" title={tag.value}>
                            {tag.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 text-center text-xs text-slate-500 dark:text-neutral-400">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No EXIF or GPS tags found in this file
                      </p>
                      <p className="text-[11px] mt-0.5">
                        This image has no embedded physical hardware or location metadata.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
