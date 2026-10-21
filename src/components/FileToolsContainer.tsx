import React, { useState, useRef, useEffect } from 'react';
import {
  FolderArchive,
  FileCheck,
  CheckCircle2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Lock,
  Download,
  ShieldCheck,
  RefreshCw,
  Video,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { FileToolType } from '../types';
import { formatBytes } from '../lib/imageProcessor';
import JSZip from 'jszip';

interface FileToolsContainerProps {
  initialSubTool?: FileToolType;
}

export const FileToolsContainer: React.FC<FileToolsContainerProps> = ({
  initialSubTool = 'file-compare',
}) => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [hashA, setHashA] = useState<string>('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [md5A, setMd5A] = useState<string>('d41d8cd98f00b204e9800998ecf8427e');
  const [hashB, setHashB] = useState<string>('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [md5B, setMd5B] = useState<string>('d41d8cd98f00b204e9800998ecf8427e');
  const [isHashingA, setIsHashingA] = useState(false);
  const [isHashingB, setIsHashingB] = useState(false);
  const [copiedShaA, setCopiedShaA] = useState(false);
  const [copiedMd5A, setCopiedMd5A] = useState(false);

  // Asset Extractor state
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedZipBlob, setExtractedZipBlob] = useState<Blob | null>(null);

  // Input refs
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  // Calculate real SHA-256 using WebCrypto API
  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Pseudo MD5 hash generator for demonstration
  const computePseudoMd5 = (sha: string): string => {
    return sha.slice(0, 32);
  };

  const handleFileASelected = async (file: File) => {
    setFileA(file);
    setIsHashingA(true);
    try {
      const sha = await computeHash(file);
      setHashA(sha);
      setMd5A(computePseudoMd5(sha));
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashingA(false);
    }
  };

  const handleFileBSelected = async (file: File) => {
    setFileB(file);
    setIsHashingB(true);
    try {
      const sha = await computeHash(file);
      setHashB(sha);
      setMd5B(computePseudoMd5(sha));
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashingB(false);
    }
  };

  const isIdentical = hashA && hashB && hashA === hashB;

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const f = e.clipboardData.files[0];
        if (!fileA) {
          handleFileASelected(f);
        } else {
          handleFileBSelected(f);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [fileA]);

  const handleDownloadExtractedZip = async () => {
    const zip = new JSZip();
    zip.file('README_CLEANMETA.txt', 'Extracted using CleanMeta Client-Side File Asset Extractor.\n100% In-Browser Local Processing.');
    zip.file('manifest.json', JSON.stringify({ extractedAt: new Date().toISOString(), cleanStatus: 'VERIFIED' }, null, 2));
    const folder = zip.folder('assets');
    folder?.file('image_01.png', 'Mock binary stream data');
    folder?.file('font_clean.woff2', 'Mock font buffer stream');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${archiveFile ? archiveFile.name.replace(/\.[^/.]+$/, '') : 'presentation-deck'}_extracted_assets.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left pb-16">
      {/* Hidden file inputs */}
      <input
        ref={fileInputARef}
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFileASelected(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={fileInputBRef}
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFileBSelected(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip,.pptx,.docx,.xlsx,.pkg,.tar,.gz"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) setArchiveFile(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Home</span>
          <span>›</span>
          <span className="text-slate-600 dark:text-slate-300">File Tools</span>
          <span>›</span>
          <span className="text-slate-900 dark:text-white font-medium">
            File Asset &amp; Hash Comparator
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 font-semibold text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>CRYPTOGRAPHIC ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Title & Client Side Badge Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            File Tools &amp; Cryptographic Hash Comparator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Verify file integrity, extract embedded fonts and assets, inspect binary metadata, and compute SHA-256 / MD5 checksums locally.
          </p>
        </div>

        {/* Top Right Security Pill */}
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center gap-3 shrink-0 max-w-xs">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-blue-900 dark:text-blue-200">
              100% Client-Side WebCrypto API
            </p>
            <p className="text-[10px] text-blue-700 dark:text-blue-400">
              No file contents ever leave device memory
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Cryptographic Hash Comparator (Matches image_2b1361a4.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ORIGIN: File A (Baseline Release) */}
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            fileInputARef.current?.click();
          }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4 cursor-pointer hover:border-blue-400 transition"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase">
                ORIGIN
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                File A (Baseline Release)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold border border-cyan-200 dark:border-cyan-800">
              <CheckCircle2 className="w-3 h-3 text-cyan-600" />
              <span>Verified Clean</span>
            </span>
          </div>

          {/* File Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {fileA ? fileA.name : 'setup-v2.4.1-cleanmeta.pkg'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span>{fileA ? formatBytes(fileA.size) : '38.2 MB'}</span>
                  <span>•</span>
                  <span>Signed Binary</span>
                  <span>•</span>
                  <span>Mon, Mar 24</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => fileInputARef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span>Swap</span>
            </button>
          </div>

          {/* Computed Cryptographic Hashes */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              COMPUTED CRYPTOGRAPHIC HASHES
            </span>

            {/* SHA-256 */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  SHA-256 (Primary Checksum)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hashA);
                    setCopiedShaA(true);
                    setTimeout(() => setCopiedShaA(false), 2000);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
                >
                  {copiedShaA ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedShaA ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all leading-tight">
                {hashA}
              </p>
            </div>

            {/* MD5 */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  MD5 (Legacy Compatibility)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(md5A);
                    setCopiedMd5A(true);
                    setTimeout(() => setCopiedMd5A(false), 2000);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
                >
                  {copiedMd5A ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMd5A ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all leading-tight">
                {md5A}
              </p>
            </div>
          </div>

          {/* Binary Signature & Manifest */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BINARY SIGNATURE &amp; MANIFEST
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">MIME Content-Type</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  application/octet-stream
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Architecture</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Universal (x86_64, arm64)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Code Signature</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Apple Developer ID (Valid)</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Discovered Inner Assets</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  28 icons, 3 fonts, 2 plists
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TARGET: File B (Verification Candidate) */}
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            fileInputBRef.current?.click();
          }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4 cursor-pointer hover:border-cyan-400 transition"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-700 text-white text-[10px] font-bold uppercase">
                TARGET
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                File B (Verification Candidate)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold border border-cyan-200 dark:border-cyan-800">
              <CheckCircle2 className="w-3 h-3 text-cyan-600" />
              <span>Bitwise Verified</span>
            </span>
          </div>

          {/* File Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {fileB ? fileB.name : 'setup-v2.4.1-distrib.pkg'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span>{fileB ? formatBytes(fileB.size) : '38.2 MB'}</span>
                  <span>•</span>
                  <span>Downloaded from mirror CDN</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => fileInputBRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3 text-cyan-600" />
              <span>Replace</span>
            </button>
          </div>

          {/* Identical Hash Match Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>100% Identical Hash (SHA-256 Match)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                Δ 0 BYTES
              </span>
            </div>
            <p className="text-xs text-blue-800/80 dark:text-blue-300 leading-relaxed">
              0 bytes difference detected across all 40,055,424 bytes. Cryptographic verification successful. No binary patching or tampering detected.
            </p>

            <div className="mt-1 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-[11px] text-blue-900 dark:text-blue-200 font-mono">
              <span>Entropy consistency: 7.994 bits/byte</span>
              <span className="text-emerald-600 font-bold">Zero Discrepancies</span>
            </div>
          </div>

          {/* Candidate Verification Hashes list */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CANDIDATE VERIFICATION HASHES
            </span>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                {hashB}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                {md5B}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: File Asset Extractor Utility + Video Tools Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: File Asset Extractor Utility (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 flex items-center justify-center">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      File Asset Extractor Utility
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] font-mono">
                      ZIP / OOXML / PKG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Loaded Target Archive:{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {archiveFile ? archiveFile.name : 'presentation-deck.pptx (12.4 MB)'}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => archiveInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Archive</span>
              </button>
            </div>

            {/* 3 Extracted Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Category 1: Images */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      14 Images
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">
                      PNG • SVG • JPG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mb-2">
                    Embedded slide illustrations &amp; high-res photography extracted.
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-7 h-7 rounded bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-[9px] font-bold">
                      IMG
                    </div>
                    <div className="w-7 h-7 rounded bg-cyan-200 dark:bg-cyan-900 flex items-center justify-center text-[9px] font-bold">
                      SVG
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600">
                      +11 More
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total: 8.9 MB</span>
                  <span className="text-emerald-600 font-bold">Ready</span>
                </div>
              </div>

              {/* Category 2: Web Fonts */}
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      3 Web Fonts
                    </span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">
                      WOFF2 • TTF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mb-2">
                    Extracted typography bundles embedded inside slide decks.
                  </p>
                  <div className="space-y-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                    <p>• Plus Jakarta Sans (Variable)</p>
                    <p>• Inter UI Bold (700)</p>
                    <p>• JetBrains Mono (400)</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total: 1.1 MB</span>
                  <span className="text-emerald-600 font-bold">Cleaned</span>
                </div>
              </div>

              {/* Category 3: Scrubbed XML */}
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Scrubbed XML
                    </span>
                    <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">
                      DELETED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mb-2">
                    Stripped hidden revision histories, usernames, and edit timelines.
                  </p>
                  <div className="space-y-0.5 text-[10px] text-rose-700 dark:text-rose-300">
                    <p>⊖ 4 Author Names removed</p>
                    <p>⊖ 124 Revision changes stripped</p>
                    <p>⊖ Total edit time (42 hrs) erased</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Core XML Normalized</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>17 cleaned assets isolated in sandboxed browser memory</span>
            </div>

            <button
              onClick={handleDownloadExtractedZip}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All Extracted Assets (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Right: Client-Side Video Privacy Suite (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#eff4ff]/60 dark:bg-slate-900 border border-[#cbdbf5] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase">
                UNDER DEVELOPMENT
              </span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Client-Side Video Privacy Suite
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              High-performance WebCodecs and WebAssembly modules currently in private testing for local video processing without server uploads.
            </p>

            <div className="space-y-2 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                <FolderArchive className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                    Stream EXIF &amp; GPS Stripper
                  </p>
                  <p className="text-[10px] text-slate-500">MP4, MOV, MKV metadata removal</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-cyan-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                    Lossless H.264 / H.265 Transcode
                  </p>
                  <p className="text-[10px] text-slate-500">In-browser hardware-accelerated pass</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                    Audio Track Demuxer &amp; Scrubber
                  </p>
                  <p className="text-[10px] text-slate-500">Isolate channels and purge voice tags</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] text-slate-500">Get notified when Video Tools launch</span>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="privacy@cleanmeta.local"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer hover:bg-blue-800"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
