/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { QueueList } from './components/QueueList';
import { MetadataModal } from './components/MetadataModal';
import { CompareModal } from './components/CompareModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AccountModal } from './components/AccountModal';
import { AuthModal } from './components/AuthModal';
import { ConverterTool } from './components/ConverterTool';
import { CompressorTool } from './components/CompressorTool';
import { BackgroundRemoverTool } from './components/BackgroundRemoverTool';
import { HistoryView } from './components/HistoryView';
import { Footer } from './components/Footer';
import { CleanFormatPreference, PhotoItem, RetentionPreference, ToolType, UserProfile } from './types';
import { extractMetadata } from './lib/metadata';
import { processAndCleanImage } from './lib/imageProcessor';
import { downloadCleanPhotosAsZip } from './lib/zipDownloader';
import { subscribeToAuthState } from './lib/firebase';
import { saveHistoryRecord } from './lib/firestore';
import { uploadToVercelBlob } from './lib/blobStorage';
import { Sparkles, Wifi, WifiOff, Cloud } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cleanmeta-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ToolType | 'history'>('metadata-remover');

  // Metadata Remover state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formatPreference, setFormatPreference] = useState<CleanFormatPreference>('auto');
  const [retentionPreference, setRetentionPreference] = useState<RetentionPreference>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Online / Offline status & App mode (Local vs Cloud)
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [appMode, setAppMode] = useState<'local' | 'cloud'>('local');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setAppMode('local');
      setRetentionPreference('none');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals state
  const [inspectingPhoto, setInspectingPhoto] = useState<PhotoItem | null>(null);
  const [comparingPhoto, setComparingPhoto] = useState<PhotoItem | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Toggle Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cleanmeta-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cleanmeta-theme', 'light');
    }
  }, [darkMode]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setUser(profile);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
        if (p.cleanedUrl) URL.revokeObjectURL(p.cleanedUrl);
      });
    };
  }, []);

  // Add files to queue
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const newItems: PhotoItem[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'image/jpeg',
      originalUrl: URL.createObjectURL(file),
      status: 'reading_meta',
    }));

    setPhotos((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      try {
        const metadata = await extractMetadata(item.file);

        const img = new Image();
        img.src = item.originalUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });

        const dimensions =
          img.naturalWidth && img.naturalHeight
            ? { width: img.naturalWidth, height: img.naturalHeight }
            : undefined;

        setPhotos((current) =>
          current.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  originalMetadata: metadata,
                  dimensions,
                  status: 'queued',
                }
              : p
          )
        );
      } catch {
        setPhotos((current) =>
          current.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: 'queued',
                }
              : p
          )
        );
      }
    }
  }, []);

  // Remove individual photo
  const handleRemovePhoto = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) {
      if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
      if (target.cleanedUrl) URL.revokeObjectURL(target.cleanedUrl);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (inspectingPhoto?.id === id) setInspectingPhoto(null);
    if (comparingPhoto?.id === id) setComparingPhoto(null);
  };

  // Clear entire queue
  const handleClearQueue = () => {
    photos.forEach((p) => {
      if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
      if (p.cleanedUrl) URL.revokeObjectURL(p.cleanedUrl);
    });
    setPhotos([]);
    setInspectingPhoto(null);
    setComparingPhoto(null);
  };

  // Process a single photo item (immediate UI update!)
  const processPhotoItem = async (photo: PhotoItem, formatPref: CleanFormatPreference) => {
    try {
      const result = await processAndCleanImage(photo.file, {
        formatPreference: formatPref,
        quality: 0.95,
      });

      const cleanedUrl = URL.createObjectURL(result.blob);

      // 1. Instantly mark as cleaned in UI (stops spinning immediately!)
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                status: 'cleaned',
                cleanedBlob: result.blob,
                cleanedUrl,
                cleanedSize: result.blob.size,
                cleanedDimensions: { width: result.width, height: result.height },
                cleanedFormat: result.outputFormat,
                cleanedMetadataVerification: result.verification,
              }
            : p
        )
      );

      // 2. Perform cloud upload & history save in the background
      (async () => {
        let blobUrl: string | undefined;
        let blobPathname: string | undefined;
        let expiresAt: number | undefined;

        if (retentionPreference !== 'none' && user) {
          try {
            const uploadRes = await uploadToVercelBlob(
              result.blob,
              `clean-${photo.name}`,
              retentionPreference,
              'metadata-remover'
            );
            if (uploadRes.success) {
              blobUrl = uploadRes.blobUrl;
              blobPathname = uploadRes.blobPathname;
              expiresAt = uploadRes.expiresAt;
            }
          } catch (e: any) {
            console.warn('Background upload notice:', e.message);
          }
        }

        if (user) {
          saveHistoryRecord(user.uid, {
            tool: 'metadata-remover',
            originalFileName: photo.name,
            inputFormat: photo.type,
            outputFormat: result.outputFormat,
            originalSize: photo.size,
            processedSize: result.blob.size,
            status: 'success',
            retention: retentionPreference,
            blobUrl,
            blobPathname,
            expiresAt,
          }).catch(() => {});
        }
      })();
    } catch (err: any) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                status: 'error',
                errorMessage: err.message || 'Failed to process image.',
              }
            : p
        )
      );
    }
  };

  // Process all queued photos
  const handleProcessAll = async () => {
    const pendingPhotos = photos.filter((p) => p.status === 'queued' || p.status === 'error');
    if (pendingPhotos.length === 0) return;

    try {
      setIsProcessing(true);

      for (const photo of pendingPhotos) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, status: 'processing', errorMessage: undefined } : p))
        );

        await processPhotoItem(photo, formatPreference);
      }
    } catch (err) {
      console.error('Batch process error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry individual photo
  const handleRetryPhoto = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    try {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'processing', errorMessage: undefined } : p))
      );

      await processPhotoItem(photo, formatPreference);
    } catch (err: any) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'error', errorMessage: err.message || 'Retry failed.' } : p))
      );
    }
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress(0);
      await downloadCleanPhotosAsZip(photos, (pct) => setZipProgress(pct));
    } catch (err: any) {
      alert(err.message || 'Unable to generate ZIP archive.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Transfer output from one tool to another pipeline
  const handleTransferToTool = (tool: ToolType, file: File) => {
    setActiveTab(tool);
    if (tool === 'metadata-remover') {
      handleFilesSelected([file]);
    }
  };

  // Helper demo sample photo
  const handleLoadSamplePhoto = async () => {
    try {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 1200;
      sampleCanvas.height = 800;
      const ctx = sampleCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 800);
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(0.8, '#93c5fd');
        grad.addColorStop(1, '#fde047');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(600, 360, 90, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, 800);
        ctx.lineTo(350, 420);
        ctx.lineTo(700, 800);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(450, 800);
        ctx.lineTo(850, 480);
        ctx.lineTo(1200, 800);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('CleanMeta Sample Photo', 60, 100);
        ctx.font = '20px sans-serif';
        ctx.fillText('Ready for metadata removal test', 60, 140);
      }

      sampleCanvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'vacation_mountain_sunset.jpg', {
            type: 'image/jpeg',
          });
          handleFilesSelected([sampleFile]);
        }
      }, 'image/jpeg', 0.95);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        isOnline={isOnline}
        activeMode={appMode}
        onToggleMode={() => {
          if (appMode === 'local') {
            if (!user) {
              setAuthModalOpen(true);
            } else {
              setAppMode('cloud');
              if (retentionPreference === 'none') {
                setRetentionPreference('4days');
              }
            }
          } else {
            setAppMode('local');
            setRetentionPreference('none');
          }
        }}
      />

      {/* Online & Offline Dual Mode Selector Banner */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                !isOnline
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  : appMode === 'local'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-4 h-4" />
              ) : appMode === 'local' ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {!isOnline
                    ? 'অফলাইন মোড (লোকাল ইঞ্জিন সক্রিয়)'
                    : appMode === 'local'
                    ? 'লোকাল মোড (১০০% অফলাইন ও প্রাইভেট)'
                    : 'ক্লাউড স্টোরেজ মোড (অনলাইন ব্যাকআপ)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    !isOnline
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : appMode === 'local'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {!isOnline ? 'Offline Safe' : appMode === 'local' ? '100% Local / Zero Upload' : 'Cloud Sync Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {!isOnline
                  ? 'ইন্টারনেট ছাড়াই সমস্ত টুল সম্পূর্ণ কাজ করছে। ছবি সরাসরি আপনার ডিভাইসে সেভ হবে।'
                  : appMode === 'local'
                  ? 'কোনো সার্ভারে আপলোড নেই। ছবি ব্রাউজার মেমোরিতে প্রসেস ও সরাসরি ডাউনলোড হয়।'
                  : 'প্রসেস করা ছবি নিরাপদে আপনার ক্লাউড স্টোরেজে সেভ থাকবে (সর্বোচ্চ মেয়াদ পর্যন্ত)।'}
              </p>
            </div>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => {
                setAppMode('local');
                setRetentionPreference('none');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                appMode === 'local'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>লোকাল (অফলাইন)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setAuthModalOpen(true);
                } else {
                  setAppMode('cloud');
                  if (retentionPreference === 'none') {
                    setRetentionPreference('4days');
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                appMode === 'cloud'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>ক্লাউড স্টোরেজ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Rendered According to Active Tab */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'metadata-remover' && (
          <>
            <Hero />
            <UploadZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

            {photos.length === 0 && (
              <div className="text-center mt-5 mb-8">
                <button
                  onClick={handleLoadSamplePhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Don't have a photo handy? Try a sample photo</span>
                </button>
              </div>
            )}

            <QueueList
              photos={photos}
              onRemovePhoto={handleRemovePhoto}
              onClearQueue={handleClearQueue}
              onProcessAll={handleProcessAll}
              onRetryPhoto={handleRetryPhoto}
              onDownloadZip={handleDownloadZip}
              onInspectMetadata={(photo) => setInspectingPhoto(photo)}
              onComparePhoto={(photo) => setComparingPhoto(photo)}
              formatPreference={formatPreference}
              onChangeFormatPreference={setFormatPreference}
              retentionPreference={retentionPreference}
              onChangeRetentionPreference={(r) => {
                if (r !== 'none' && !user) {
                  setAuthModalOpen(true);
                } else {
                  setRetentionPreference(r);
                }
              }}
              onSendToTool={handleTransferToTool}
              isProcessing={isProcessing}
              isZipping={isZipping}
              zipProgress={zipProgress}
            />
          </>
        )}

        {activeTab === 'bg-remover' && (
          <BackgroundRemoverTool
            user={user}
            onSendToTool={handleTransferToTool}
          />
        )}

        {activeTab === 'converter' && (
          <ConverterTool
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSendToTool={handleTransferToTool}
          />
        )}

        {activeTab === 'compressor' && (
          <CompressorTool
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSendToTool={handleTransferToTool}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView user={user} onOpenAuth={() => setAuthModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      {/* Modals */}
      <MetadataModal photo={inspectingPhoto} onClose={() => setInspectingPhoto(null)} />
      <CompareModal photo={comparingPhoto} onClose={() => setComparingPhoto(null)} />
      <HowItWorksModal isOpen={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} user={user} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
