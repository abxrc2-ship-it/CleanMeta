import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  UploadCloud,
  ShieldAlert,
  MapPin,
  Camera,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Share2,
} from 'lucide-react';
import { extractMetadata } from '../lib/metadata';
import { DetectedMetadata, TagDetail } from '../types';
import { formatBytes } from '../lib/imageProcessor';

export const ViewMetadataTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DetectedMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setIsLoading(true);

      try {
        const meta = await extractMetadata(selected);
        setMetadata(meta);
      } catch (err) {
        console.error('Failed to extract metadata', err);
      } finally {
        setIsLoading(false);
      }
      if (e.target) e.target.value = '';
    }
  };

  // Paste support (Ctrl+V) in ViewMetadataTool
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
          setIsLoading(true);
          try {
            const meta = await extractMetadata(selected);
            setMetadata(meta);
          } catch (err) {
            console.error('Failed to extract metadata', err);
          } finally {
            setIsLoading(false);
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const filteredTags = metadata?.tagList.filter((tag) => {
    const matchesSearch =
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || tag.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                View Image Metadata & EXIF
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Inspect raw EXIF tags, GPS telemetry, lens optics, and camera serials in-depth.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold self-start sm:self-auto">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Local EXIF Engine • No Server Upload</span>
        </div>
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Select an image to inspect metadata
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Inspect GPS latitude/longitude, camera serials, lens profile, shutter count, and creation timestamps.
          </p>
          <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition">
            Choose Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image summary & Privacy Warning */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
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
              <button
                onClick={() => {
                  setFile(null);
                  setMetadata(null);
                }}
                className="mt-3 text-xs text-indigo-600 hover:underline"
              >
                Inspect another file
              </button>
            </div>

            {/* Privacy Alert */}
            {metadata?.hasGps ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>GPS Geotags Detected!</span>
                </div>
                <p>
                  This photo exposes the precise physical location where it was taken:
                </p>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 font-mono text-[11px] flex flex-col gap-1 border border-rose-200/50">
                  <span>Lat: {metadata.gpsLatitude?.toFixed(6)}°</span>
                  <span>Lng: {metadata.gpsLongitude?.toFixed(6)}°</span>
                  {metadata.gpsAltitude && <span>Alt: {metadata.gpsAltitude.toFixed(1)}m</span>}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>No GPS location coordinates detected in this file.</span>
              </div>
            )}

            {/* Quick Specs */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {metadata?.isAiGenerated ? 'AI Media Engine' : 'Hardware & Optics'}
              </span>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  {metadata?.isAiGenerated ? 'Generator' : 'Camera'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {metadata?.isAiGenerated
                    ? (metadata.aiToolOrSoftware || 'AI Generated Graphic')
                    : (metadata?.cameraMake || metadata?.cameraModel
                        ? `${metadata.cameraMake || ''} ${metadata.cameraModel || ''}`.trim()
                        : 'None (Digital / AI Image)')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  {metadata?.isAiGenerated ? 'Prompt Info' : 'Lens'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {metadata?.isAiGenerated
                    ? (metadata.aiPromptSnippet ? 'Prompt Embedded' : 'Synthetic Media')
                    : (metadata?.lensModel || 'None / N/A')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Captured / Created</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata?.dateTimeOriginal || metadata?.dateTime || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Tags</span>
                <span className="font-bold text-indigo-600">
                  {metadata?.allTagsCount || 0} embedded tags
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Full Searchable Tag Table */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search metadata tags (e.g., ISO, FNumber, Serial, Software)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'Camera', 'GPS', 'Date', 'Software', 'Other'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                        activeCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Tag Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Decoded Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {filteredTags && filteredTags.length > 0 ? (
                      filteredTags.map((tag, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                            {tag.name}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {tag.category || 'EXIF'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300 break-all select-all">
                            {tag.value}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 font-sans">
                          {isLoading ? 'Scanning metadata headers...' : 'No matching metadata tags found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
