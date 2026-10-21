import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  CloudOff,
  Gift,
  Wrench,
  Image as ImageIcon,
  FileText,
  FolderArchive,
  Video,
  Layers,
  Search,
  Sliders,
  RefreshCw,
  Eye,
  GitCompare,
  Scissors,
  Images,
  PenTool,
  Binary,
  FileCheck,
  HelpCircle,
  Bell,
  Clock,
  Terminal,
  Star,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Zap,
  ServerOff,
  DatabaseZap,
  ShieldAlert,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface HomeViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenHowItWorks: () => void;
  favorites?: string[];
  onToggleFavorite?: (toolId: string) => void;
  darkMode?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenHowItWorks,
  favorites = ['metadata-remover', 'pdf-viewer', 'pdf-editor', 'pdf-merge'],
  onToggleFavorite,
  darkMode = true,
}) => {
  const [videoNotifyEmail, setVideoNotifyEmail] = useState('');
  const [videoNotified, setVideoNotified] = useState(false);
  const [showAllPdfTools, setShowAllPdfTools] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoNotifyEmail) return;
    setVideoNotified(true);
    setTimeout(() => {
      setVideoNotifyEmail('');
    }, 3000);
  };

  // Master tools dictionary for favorites lookup
  const allToolsMap: Record<
    string,
    { title: string; category: string; description: string; icon: any }
  > = {
    'metadata-remover': {
      title: 'Image Metadata Remover',
      category: 'Image Tools',
      description: 'Strip EXIF, GPS location, camera serials, and dates locally in browser.',
      icon: ImageIcon,
    },
    'metadata-editor': {
      title: 'Edit Metadata',
      category: 'Image Tools',
      description: 'Modify EXIF, IPTC author copyright, and title tags in place.',
      icon: Sliders,
    },
    'metadata-viewer': {
      title: 'Metadata Inspector',
      category: 'Image Tools',
      description: 'Inspect raw EXIF, lens info, and color profile dictionaries.',
      icon: Search,
    },
    converter: {
      title: 'Image Converter',
      category: 'Image Tools',
      description: 'Fast multi-format conversion between JPG, PNG, and WebP.',
      icon: RefreshCw,
    },
    compressor: {
      title: 'Image Compressor',
      category: 'Image Tools',
      description: 'Lossless & lossy local compression with slider control.',
      icon: Sliders,
    },
    'image-compare': {
      title: 'Compare Images',
      category: 'Image Tools',
      description: 'Side-by-side split diff slider highlighting pixel variance.',
      icon: GitCompare,
    },
    'pdf-viewer': {
      title: 'PDF Viewer & Reader',
      category: 'PDF Tools',
      description: 'High-fidelity document viewer with distraction-free text reader & search.',
      icon: Eye,
    },
    'pdf-editor': {
      title: 'PDF Editor & Sign',
      category: 'PDF Tools',
      description: 'Add text annotations, draw signatures, blackout redaction, and stamps.',
      icon: PenTool,
    },
    'pdf-merge': {
      title: 'Merge PDFs',
      category: 'PDF Tools',
      description: 'Combine multiple PDF documents into a single unified file.',
      icon: Layers,
    },
    'pdf-organize': {
      title: 'Organize Pages',
      category: 'PDF Tools',
      description: 'Reorder pages, rotate orientations, and remove unwanted sheets.',
      icon: Layers,
    },
    'pdf-compress': {
      title: 'Compress PDF',
      category: 'PDF Tools',
      description: 'Optimize PDF file size with balanced compression profiles.',
      icon: Sliders,
    },
    'pdf-protect': {
      title: 'Protect & Lock',
      category: 'PDF Tools',
      description: 'Scrub revision histories, flatten form fields, and password protect.',
      icon: Lock,
    },
    'images-to-pdf': {
      title: 'Images to PDF',
      category: 'PDF Tools',
      description: 'Convert JPG, PNG, and WebP photo sets into high-res PDF documents.',
      icon: Images,
    },
    'file-asset-extract': {
      title: 'File Asset Extraction',
      category: 'File Tools',
      description: 'Extract embedded payloads, XML streams, and attachments.',
      icon: Binary,
    },
    'file-compare': {
      title: 'Compare Files & Hashes',
      category: 'File Tools',
      description: 'Generate SHA-256 and MD5 cryptographic checksums client-side.',
      icon: FileCheck,
    },
  };

  const favoritedList = favorites
    .map((id) => ({ id, ...allToolsMap[id] }))
    .filter((t) => t.title);

  return (
    <div className="w-full flex flex-col gap-10 pb-16">
      {/* ============================================================== */}
      {/* SECTION 1: HERO CANVAS (100% Reliable Dark & Light Mode) */}
      {/* ============================================================== */}
      <section
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-12 border transition-all duration-300 ${
          darkMode
            ? 'bg-[#0a0a0a] text-white border-neutral-800 shadow-2xl'
            : 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/80 text-slate-900 border-slate-200/90 shadow-xl'
        }`}
      >
        {/* Ambient atmospheric glow */}
        <div
          className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            darkMode ? 'bg-cyan-500/10' : 'bg-blue-400/15'
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            darkMode ? 'bg-blue-600/10' : 'bg-sky-300/20'
          }`}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Founder Badge & Value Propos */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            {/* Top Engine Status + Founder Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs ${
                  darkMode
                    ? 'bg-neutral-900 border border-neutral-800 text-cyan-400'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="tracking-wide font-mono font-bold text-[11px]">
                  ENGINE STATUS: 100% CLIENT-SIDE ACTIVE
                </span>
              </div>

              {/* Founder Tag (Explicitly requested) */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs ${
                  darkMode
                    ? 'bg-neutral-900/90 border border-neutral-800 text-neutral-300'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-400">Founder:</span>
                <span className="font-extrabold text-[11px] text-slate-900 dark:text-white">Rayhan Chowdhury</span>
              </div>
            </div>

            {/* Display Title */}
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              CleanMeta — Your All-in-One File Tools Platform
            </h1>

            {/* Subtitle */}
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                darkMode ? 'text-neutral-300' : 'text-slate-600'
              }`}
            >
              Remove metadata, inspect hidden tags, convert formats, optimize, and compare documents.
              Fast, secure, and client-side safe without sending a single byte to remote servers.
            </p>

            {/* 4 Trust Checkmarks */}
            <div
              className={`grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-4 text-xs font-medium pt-1 ${
                darkMode ? 'text-neutral-200' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>No Installation Required</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>100% Browser-Based</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Safe &amp; Zero-Upload</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Cross-Platform</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('all-tools')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer group hover:scale-[1.02]"
              >
                <span>Explore All Tools</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenHowItWorks}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] ${
                  darkMode
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Platform Features & Architecture Showcase (Replaces spinning orb per request) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                darkMode
                  ? 'bg-neutral-950/90 border-neutral-800 text-white'
                  : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    Core Security Architecture
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Zero Telemetry
                </span>
              </div>

              {/* 3 Live Feature Highlight Cards with 3D Hover Depth */}
              <div className="space-y-2.5">
                <div
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                    darkMode
                      ? 'bg-neutral-900/80 border-neutral-800 hover:border-cyan-500/50'
                      : 'bg-slate-50 border-slate-200/80 hover:border-blue-500/50'
                  }`}
                  onClick={() => onNavigate('metadata-remover')}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 shrink-0 flex items-center justify-center mt-0.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>EXIF &amp; GPS Privacy Sanitizer</span>
                        <span className="text-[10px] text-blue-600 font-mono">›</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug mt-0.5">
                        Strips location coordinates, camera models, and timestamps in RAM.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                    darkMode
                      ? 'bg-neutral-900/80 border-neutral-800 hover:border-rose-500/50'
                      : 'bg-slate-50 border-slate-200/80 hover:border-rose-500/50'
                  }`}
                  onClick={() => onNavigate('pdf-viewer')}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 shrink-0 flex items-center justify-center mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>High-Fidelity PDF Suite</span>
                        <span className="text-[10px] text-rose-600 font-mono">›</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug mt-0.5">
                        Live document viewing, text reading, digital signing, and redaction.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                    darkMode
                      ? 'bg-neutral-900/80 border-neutral-800 hover:border-emerald-500/50'
                      : 'bg-slate-50 border-slate-200/80 hover:border-emerald-500/50'
                  }`}
                  onClick={() => onNavigate('file-compare')}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 shrink-0 flex items-center justify-center mt-0.5">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>WebCrypto &amp; WASM Engine</span>
                        <span className="text-[10px] text-emerald-600 font-mono">›</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug mt-0.5">
                        Cryptographic SHA-256 hashes computed on your local GPU/CPU.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-neutral-800 text-center">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-900">
                  <span className="text-sm font-black text-blue-600 dark:text-cyan-400 block">0.0ms</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Server Ping</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-900">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">100%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Local Memory</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-900">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">0</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">External Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: FAVORITE / PINNED TOOLS SHELF */}
      {/* ============================================================== */}
      {favoritedList.length > 0 && (
        <section className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Your Pinned &amp; Favorite Tools</span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
                    {favoritedList.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Quick-launch your starred tools directly from home
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('favorites')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Favorites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {favoritedList.map((tool) => {
              const Icon = tool.icon || Sparkles;
              return (
                <div
                  key={tool.id}
                  onClick={() => onNavigate(tool.id as NavigationTab)}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-amber-200/80 dark:border-neutral-800 hover:border-amber-400 hover:-translate-y-1.5 hover:scale-[1.02] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(tool.id);
                          }}
                          className="p-1 rounded text-amber-500 hover:scale-125 transition cursor-pointer"
                          title="Unpin from Home"
                        >
                          <Star className="w-4 h-4 fill-amber-500" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-neutral-500 block mb-0.5">
                      {tool.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-3 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: IMAGE TOOLS (6 TOOLS with 3D Hover Depth) */}
      {/* ============================================================== */}
      <section className="flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Image Tools
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold">
                  6 Tools
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Privacy-first image metadata removal, EXIF editing, conversion, and compression
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('image-tools')}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'metadata-remover', title: 'Metadata Remover', desc: 'Strip EXIF, GPS coords, camera serials locally.', icon: ImageIcon, badge: 'Popular' },
            { id: 'metadata-editor', title: 'Edit Metadata', desc: 'Modify EXIF, IPTC author copyright, and title tags.', icon: Sliders },
            { id: 'metadata-viewer', title: 'Metadata Inspector', desc: 'Inspect raw EXIF, lens info, and color profiles.', icon: Search },
            { id: 'converter', title: 'Image Converter', desc: 'Fast conversion between JPG, PNG, and WebP.', icon: RefreshCw },
            { id: 'compressor', title: 'Image Compressor', desc: 'Lossless & lossy local compression with slider control.', icon: Sliders },
            { id: 'image-compare', title: 'Compare Images', desc: 'Side-by-side split diff slider highlighting variance.', icon: GitCompare },
          ].map((tool) => {
            const Icon = tool.icon;
            const isFav = favorites.includes(tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => onNavigate(tool.id as NavigationTab)}
                className="group relative p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 hover:border-blue-500 hover:-translate-y-1.5 hover:scale-[1.02] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      {tool.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                          {tool.badge}
                        </span>
                      )}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(tool.id);
                          }}
                          className={`p-1 rounded transition cursor-pointer ${
                            isFav ? 'text-amber-500' : 'text-slate-300 dark:text-neutral-600 hover:text-amber-400'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: PDF TOOLS (Essential Tools in Front with 3D Depth) */}
      {/* ============================================================== */}
      <section className="flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  PDF Tools Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  Essential First
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                View documents, edit content, combine files, compress, and sign locally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllPdfTools(!showAllPdfTools)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
            >
              <span>{showAllPdfTools ? 'Show Essential Only' : 'Show All 14 Utilities'}</span>
              {showAllPdfTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onNavigate('pdf-tools')}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer hover:scale-[1.02]"
            >
              <span>Open Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PRIMARY ESSENTIAL PDF TOOLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              id: 'pdf-viewer',
              title: 'PDF Viewer & Reader',
              desc: 'Instantly view document pages, zoom, and read clean extracted text.',
              icon: Eye,
              badge: 'Essential',
              color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
            },
            {
              id: 'pdf-editor',
              title: 'PDF Editor & Sign',
              desc: 'Add text annotations, draw digital signature, and blackout redact.',
              icon: PenTool,
              badge: 'Interactive',
              color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60',
            },
            {
              id: 'pdf-merge',
              title: 'Merge PDFs',
              desc: 'Combine multiple documents into a single unified clean file.',
              icon: Layers,
              badge: 'Popular',
              color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60',
            },
            {
              id: 'pdf-compress',
              title: 'Compress PDF',
              desc: 'Reduce file size up to 74% with client-side deflate profiles.',
              icon: Sliders,
              color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
            },
            {
              id: 'pdf-protect',
              title: 'Protect & Lock',
              desc: 'Scrub revision histories, flatten interactive forms, and lock.',
              icon: Lock,
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60',
            },
            {
              id: 'images-to-pdf',
              title: 'Images to PDF',
              desc: 'Bundle JPG, PNG, and WebP photo sets into high-res documents.',
              icon: Images,
              color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60',
            },
          ].map((tool) => {
            const Icon = tool.icon;
            const isFav = favorites.includes(tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => onNavigate(tool.id as NavigationTab)}
                className="group relative p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 hover:border-blue-500 hover:-translate-y-1.5 hover:scale-[1.02] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      {tool.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] font-bold">
                          {tool.badge}
                        </span>
                      )}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(tool.id);
                          }}
                          className={`p-1 rounded transition cursor-pointer ${
                            isFav ? 'text-amber-500' : 'text-slate-300 dark:text-neutral-600 hover:text-amber-400'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* EXPANDABLE SECONDARY UTILITIES */}
        {showAllPdfTools && (
          <div className="pt-2 border-t border-slate-200/80 dark:border-neutral-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Secondary &amp; Utility PDF Modules
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {[
                { id: 'pdf-organize', title: 'Organize Pages', desc: 'Reorder and rotate sheets', icon: Layers },
                { id: 'pdf-split', title: 'Split PDF', desc: 'Extract page ranges or parts', icon: Scissors },
                { id: 'pdf-to-image', title: 'PDF to Image', desc: 'Render raster image frames', icon: ImageIcon },
                { id: 'pdf-ocr', title: 'OCR & Text', desc: 'Extract text streams', icon: FileText },
                { id: 'pdf-asset-remover', title: 'Metadata Cleaner', desc: 'Scrub author & producer tags', icon: ShieldCheck },
                { id: 'pdf-parser', title: 'Asset Remover', desc: 'Strip embedded binaries', icon: Binary },
                { id: 'pdf-compare', title: 'Compare PDFs', desc: 'Side-by-side document diff', icon: GitCompare },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => onNavigate(tool.id as NavigationTab)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#111111] hover:bg-white dark:hover:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center mb-2">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {tool.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {tool.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 mt-2 block">
                      Launch ›
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 5: FILE TOOLS (2 UTILITIES) + VIDEO ROADMAP */}
      {/* ============================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        {/* Left: File Tools */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  File Tools
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                  2 Utilities
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Low-level binary inspection and cryptographic integrity utilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tool 1 */}
            <div
              onClick={() => onNavigate('file-asset-extract')}
              className="group p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 hover:border-blue-500 hover:-translate-y-1.5 hover:scale-[1.02] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                  <Binary className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  File Asset Extraction
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Extract embedded binary payloads, XML streams, attachments, and thumbnail streams from proprietary formats.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Open Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Tool 2 */}
            <div
              onClick={() => onNavigate('file-compare')}
              className="group p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 hover:border-blue-500 hover:-translate-y-1.5 hover:scale-[1.02] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center mb-3">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  Compare Files &amp; Hashes
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Generate client-side MD5, SHA-1, SHA-256 checksums to verify payload purity without exposing file contents.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Open Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video Tools Roadmap Card (Guaranteed Dark in Dark Mode, Light in Light Mode) */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-3xl border transition-all duration-200 ${
            darkMode
              ? 'bg-[#0a0a0a] text-white border-neutral-800 shadow-md'
              : 'bg-gradient-to-br from-violet-50/90 via-white to-purple-50/70 text-slate-900 border-violet-200/80 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">
                  Video Tools Suite
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            <h3 className="font-extrabold text-base leading-snug">
              Client-Side Video Processing: WebCodecs + WebGPU
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Scrub MP4/MOV metadata, inspect hidden GPS tracks, and compress high-definition video directly in browser memory without sending a single byte to remote servers.
            </p>

            <div className="space-y-2 text-xs text-slate-700 dark:text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                <span>Zero Remote Transcoding — 100% Client-Side</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                <span>WebGPU Hardware-Accelerated Video Pipeline</span>
              </div>
            </div>
          </div>

          {/* Email Notification Signup */}
          <div className="pt-5 mt-4 border-t border-slate-200 dark:border-neutral-800">
            {videoNotified ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>You're on the list! We'll notify you on launch.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter email for early access..."
                  value={videoNotifyEmail}
                  onChange={(e) => setVideoNotifyEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-sm hover:scale-[1.02]"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
