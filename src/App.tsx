/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { ImageMetadataRemoverWorkspace } from './components/ImageMetadataRemoverWorkspace';
import { UploadZone } from './components/UploadZone';
import { QueueList } from './components/QueueList';
import { MetadataModal } from './components/MetadataModal';
import { CompareModal } from './components/CompareModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';

// Image Tools
import { ConverterTool } from './components/ConverterTool';
import { CompressorTool } from './components/CompressorTool';
import { ImageResizerTool } from './components/ImageResizerTool';
import { ViewMetadataTool } from './components/ViewMetadataTool';
import { EditMetadataTool } from './components/EditMetadataTool';
import { CompareImagesTool } from './components/CompareImagesTool';

// PDF Tools Suite (14 tools)
import { PdfToolsSuite } from './components/PdfToolsSuite';

// File & Video Tools
import { FileToolsContainer } from './components/FileToolsContainer';
import { VideoComingSoon } from './components/VideoComingSoon';

// SaaS Directory Views
import { AllToolsDirectory } from './components/AllToolsDirectory';
import { MyFilesView } from './components/MyFilesView';
import { FavoritesView } from './components/FavoritesView';
import { PricingView } from './components/PricingView';
import { HelpAboutView } from './components/HelpAboutView';
import { HistoryView } from './components/HistoryView';
import { Footer } from './components/Footer';

import {
  CleanFormatPreference,
  NavigationTab,
  PhotoItem,
  RetentionPreference,
  StoredFileItem,
  UserProfile,
} from './types';
import { extractMetadata } from './lib/metadata';
import { processAndCleanImage } from './lib/imageProcessor';
import { downloadCleanPhotosAsZip } from './lib/zipDownloader';
import { subscribeToAuthState, signOutUser } from './lib/firebase';
import { saveHistoryRecord } from './lib/firestore';
import { uploadToVercelBlob } from './lib/blobStorage';
import { getCleanMetaFilename } from './lib/naming';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cleanmeta-theme');
    if (saved) return saved === 'dark';
    return false; // Light theme default per design
  });

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cleanmeta-favorites');
      return saved ? JSON.parse(saved) : ['metadata-remover', 'image-resizer', 'pdf-organize', 'converter'];
    } catch {
      return ['metadata-remover', 'image-resizer', 'pdf-organize', 'converter'];
    }
  });

  const toggleFavorite = (toolId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      localStorage.setItem('cleanmeta-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Stored Files for "My Files"
  const [storedFiles, setStoredFiles] = useState<StoredFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('cleanmeta-stored-files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteStoredFile = (id: string) => {
    setStoredFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem('cleanmeta-stored-files', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearLocalVault = () => {
    setStoredFiles([]);
    setPhotos([]);
    localStorage.removeItem('cleanmeta-stored-files');
  };

  // Metadata Remover state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formatPreference, setFormatPreference] = useState<CleanFormatPreference>('auto');
  const [retentionPreference, setRetentionPreference] = useState<RetentionPreference>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Modals state
  const [inspectingPhoto, setInspectingPhoto] = useState<PhotoItem | null>(null);
  const [comparingPhoto, setComparingPhoto] = useState<PhotoItem | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

    // Automatically switch to metadata-remover workspace so user sees their photos
    setActiveTab((prev) => (prev === 'home' ? 'metadata-remover' : prev));

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

  // Global document paste handler (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.clipboardData?.items) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              const extension = item.type.split('/')[1] || 'png';
              const file = new File(
                [blob],
                `pasted-photo-${Date.now()}-${i + 1}.${extension}`,
                { type: item.type }
              );
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          if (activeTab !== 'metadata-remover') {
            setActiveTab('metadata-remover');
          }
          handleFilesSelected(imageFiles);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeTab, handleFilesSelected]);

  // Remove photo from queue
  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.originalUrl) URL.revokeObjectURL(photo.originalUrl);
      if (photo?.cleanedUrl) URL.revokeObjectURL(photo.cleanedUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Clear queue
  const handleClearQueue = () => {
    photos.forEach((p) => {
      if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
      if (p.cleanedUrl) URL.revokeObjectURL(p.cleanedUrl);
    });
    setPhotos([]);
  };

  // Download all cleaned as ZIP
  const handleDownloadZip = async () => {
    const cleaned = photos.filter((p) => p.status === 'cleaned' && p.cleanedBlob);
    if (cleaned.length === 0) return;

    try {
      setIsZipping(true);
      setZipProgress(0);
      await downloadCleanPhotosAsZip(photos, (prog) => {
        setZipProgress(prog);
      });
    } catch (err) {
      console.error('ZIP creation failed:', err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafe] dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors font-sans antialiased">
      {/* 240px Persistent Sidebar on desktop & slide-out on mobile */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        favoritesCount={favorites.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content wrapper shifted 240px on desktop */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen w-full">
        {/* Navigation Header */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          user={user}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          favoritesCount={favorites.length}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
          {/* VIEW 1: HOME PAGE (Matches image_05161161.png with Pinned Favorites Shelf & 3D Interactive Hero) */}
          {activeTab === 'home' && (
            <HomeView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenHowItWorks={() => setHowItWorksOpen(true)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              darkMode={darkMode}
            />
          )}

          {/* VIEW 2: IMAGE METADATA REMOVER WORKSPACE (Matches image_66a5d8d0.png) */}
          {activeTab === 'metadata-remover' && (
            <ImageMetadataRemoverWorkspace
              photos={photos}
              onAddPhotos={handleFilesSelected}
              onRemovePhoto={handleRemovePhoto}
              onClearQueue={handleClearQueue}
              onDownloadZip={handleDownloadZip}
              formatPreference={formatPreference}
              onChangeFormatPreference={setFormatPreference}
              retentionPreference={retentionPreference}
              onChangeRetentionPreference={setRetentionPreference}
            />
          )}

          {/* IMAGE TOOLS */}
          {activeTab === 'image-resizer' && <ImageResizerTool />}
          {activeTab === 'converter' && (
            <ConverterTool
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
              onSendToTool={(tool) => setActiveTab(tool)}
            />
          )}
          {activeTab === 'compressor' && (
            <CompressorTool
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
              onSendToTool={(tool) => setActiveTab(tool)}
            />
          )}
          {activeTab === 'image-compare' && <CompareImagesTool />}
          {activeTab === 'metadata-viewer' && <ViewMetadataTool />}
          {activeTab === 'metadata-editor' && <EditMetadataTool />}
          {activeTab === 'image-tools' && (
            <AllToolsDirectory
              initialCategory="image"
              onSelectTool={(t) => setActiveTab(t)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {/* PDF TOOLS SUITE (14 tools, matches image_2d761233.png & image_15c2dc79.png) */}
          {(activeTab === 'pdf-tools' || activeTab.startsWith('pdf-') || activeTab === 'images-to-pdf') && (
            <PdfToolsSuite
              initialSubTool={
                activeTab.startsWith('pdf-') || activeTab === 'images-to-pdf'
                  ? (activeTab as any)
                  : 'pdf-viewer'
              }
              onToolSelect={(sub) => setActiveTab(sub)}
            />
          )}

          {/* FILE TOOLS (Matches image_2b1361a4.png) */}
          {(activeTab === 'file-tools' || activeTab.startsWith('file-')) && (
            <FileToolsContainer
              initialSubTool={activeTab.startsWith('file-') ? (activeTab as any) : 'file-compare'}
            />
          )}

          {/* VIDEO TOOLS (ROADMAP / COMING SOON) */}
          {(activeTab === 'video-tools' || activeTab.startsWith('video-')) && <VideoComingSoon />}

          {/* ALL TOOLS DIRECTORY */}
          {activeTab === 'all-tools' && (
            <AllToolsDirectory
              onSelectTool={(t) => setActiveTab(t)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {/* SAAS ACCOUNT / VAULT / PRICING / HELP */}
          {activeTab === 'my-files' && (
            <MyFilesView
              user={user}
              files={storedFiles}
              onDeleteFile={handleDeleteStoredFile}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView user={user} onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {activeTab === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              onSelectTool={(t) => setActiveTab(t)}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {activeTab === 'pricing' && <PricingView />}
          {(activeTab === 'help' || activeTab === 'about') && <HelpAboutView />}
        </main>

        {/* Global Modals */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          retentionPreference={retentionPreference}
          onSelectRetention={setRetentionPreference}
          user={user}
          onSignOut={() => signOutUser().then(() => setUser(null))}
          onClearLocalVault={handleClearLocalVault}
        />

        {inspectingPhoto && (
          <MetadataModal
            photo={inspectingPhoto}
            onClose={() => setInspectingPhoto(null)}
          />
        )}

        {comparingPhoto && (
          <CompareModal
            photo={comparingPhoto}
            onClose={() => setComparingPhoto(null)}
          />
        )}

        <HowItWorksModal
          isOpen={howItWorksOpen}
          onClose={() => setHowItWorksOpen(false)}
        />

        <PrivacyPolicyModal
          isOpen={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Footer */}
        <Footer
          onOpenHowItWorks={() => setHowItWorksOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />
      </div>
    </div>
  );
}
