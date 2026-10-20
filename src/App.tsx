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
import { Footer } from './components/Footer';
import { CleanFormatPreference, PhotoItem, UserProfile } from './types';
import { extractMetadata } from './lib/metadata';
import { processAndCleanImage } from './lib/imageProcessor';
import { downloadCleanPhotosAsZip } from './lib/zipDownloader';
import { subscribeToAuthState } from './lib/firebase';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cleanmeta-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formatPreference, setFormatPreference] = useState<CleanFormatPreference>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

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

    // Inspect metadata & dimensions asynchronously for each new item
    for (const item of newItems) {
      try {
        const metadata = await extractMetadata(item.file);

        // Load dimensions
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
      } catch (err) {
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

  // Process a single photo item
  const processPhotoItem = async (photo: PhotoItem, formatPref: CleanFormatPreference) => {
    try {
      const result = await processAndCleanImage(photo.file, {
        formatPreference: formatPref,
        quality: 0.95,
      });

      const cleanedUrl = URL.createObjectURL(result.blob);

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

    setIsProcessing(true);

    for (const photo of pendingPhotos) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'processing', errorMessage: undefined } : p))
      );

      await processPhotoItem(photo, formatPreference);
    }

    setIsProcessing(false);
  };

  // Retry individual photo
  const handleRetryPhoto = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'processing', errorMessage: undefined } : p))
    );

    await processPhotoItem(photo, formatPreference);
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

  // Helper to load a demo sample photo
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
        onOpenAccount={() => setAccountOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Hero />

        {/* Upload Box */}
        <UploadZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {/* Sample Photo Helper Button */}
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

        {/* Queue & Action Results */}
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
          isProcessing={isProcessing}
          isZipping={isZipping}
          zipProgress={zipProgress}
        />
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
