import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Layers,
  Scissors,
  FileImage,
  Edit3,
  Percent,
  Images,
  PenTool,
  Lock,
  Binary,
  GitCompare,
  BookOpen,
  Copy,
  RefreshCw,
  Eye,
  FileCheck,
  Check,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Type,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PdfToolType } from '../types';
import {
  analyzePdf,
  organizePdf,
  mergePdfs,
  splitPdf,
  imagesToPdf,
  editAndExportPdf,
  compressPdf,
  sanitizePdf,
  extractPdfText,
  PdfAnalysis,
  PdfEditElement,
} from '../lib/pdfProcessor';
import { formatBytes } from '../lib/imageProcessor';
import { getCleanMetaFilename } from '../lib/naming';

interface PdfToolsSuiteProps {
  initialSubTool?: PdfToolType;
  onToolSelect?: (tool: PdfToolType) => void;
}

export const PdfToolsSuite: React.FC<PdfToolsSuiteProps> = ({
  initialSubTool = 'pdf-viewer',
  onToolSelect,
}) => {
  const [currentTool, setCurrentTool] = useState<PdfToolType>(
    initialSubTool || 'pdf-viewer'
  );

  useEffect(() => {
    if (initialSubTool) {
      setCurrentTool(initialSubTool);
    }
  }, [initialSubTool]);

  const handleSubToolChange = (tool: PdfToolType) => {
    setCurrentTool(tool);
    if (onToolSelect) onToolSelect(tool);
  };

  // Shared file state
  const [file, setFile] = useState<File | null>(null);
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [pdfAnalysis, setPdfAnalysis] = useState<PdfAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Viewer state
  const [viewMode, setViewMode] = useState<'document' | 'reader'>('document');
  const [extractedText, setExtractedText] = useState<string>('');
  const [textSearchQuery, setTextSearchQuery] = useState('');
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [copiedText, setCopiedText] = useState(false);

  // Organize & Pages state
  const [pageOrder, setPageOrder] = useState<
    Array<{
      id: string;
      originalIndex: number;
      pageNumber: number;
      rotation: number;
      selected: boolean;
      isFlagged: boolean;
      title: string;
    }>
  >([]);

  // Editor state
  const [editorElements, setEditorElements] = useState<PdfEditElement[]>([]);
  const [activeEditorPage, setActiveEditorPage] = useState<number>(0);
  const [activeEditorTool, setActiveEditorTool] = useState<'text' | 'signature' | 'redaction' | 'stamp'>('text');
  
  // Editor inputs
  const [newTextContent, setNewTextContent] = useState('');
  const [newTextColor, setNewTextColor] = useState('#1e293b');
  const [newTextSize, setNewTextSize] = useState<number>(18);
  const [newStampText, setNewStampText] = useState('CONFIDENTIAL');
  const [newStampColor, setNewStampColor] = useState('#dc2626');
  const [redactionWidth, setRedactionWidth] = useState<number>(35);
  const [redactionHeight, setRedactionHeight] = useState<number>(8);

  // Digital Signature Pad Canvas
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignatureDrawing, setHasSignatureDrawing] = useState(false);
  const [sigPenColor, setSigPenColor] = useState('#0f172a');
  const [sigPenWidth, setSigPenWidth] = useState<number>(3);

  // Multi-file state for Merge
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);

  // Images for Images to PDF
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePageSize, setImagePageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Compress state
  const [compressLevel, setCompressLevel] = useState<'minimal' | 'balanced' | 'high'>('balanced');

  // Protect state
  const [protectPassword, setProtectPassword] = useState('');
  const [flattenForms, setFlattenForms] = useState(true);
  const [scrubTimestamps, setScrubTimestamps] = useState(true);

  // Split state
  const [splitRange, setSplitRange] = useState('');
  const [splitAsSingle, setSplitAsSingle] = useState(true);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalPagesInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on change or unmount
  useEffect(() => {
    return () => {
      if (fileBlobUrl) {
        URL.revokeObjectURL(fileBlobUrl);
      }
    };
  }, [fileBlobUrl]);

  // Load PDF file
  const loadPdf = async (selected: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFile(selected);

    try {
      if (fileBlobUrl) {
        URL.revokeObjectURL(fileBlobUrl);
      }
      const newUrl = URL.createObjectURL(selected);
      setFileBlobUrl(newUrl);

      const analysis = await analyzePdf(selected);
      setPdfAnalysis(analysis);

      // Extract plain text for Reader mode
      const rawText = await extractPdfText(selected);
      setExtractedText(rawText);

      // Build pages
      const pages = analysis.pages.map((p, idx) => ({
        id: `page-${idx}`,
        originalIndex: idx,
        pageNumber: p.pageNumber,
        rotation: p.rotation,
        selected: false,
        isFlagged: idx === 2 && analysis.detectedLeaksCount > 0,
        title: idx === 0 ? 'Page 1 (Cover)' : `Page ${p.pageNumber}`,
      }));

      setPageOrder(pages);
      setActiveEditorPage(0);
      setEditorElements([]);
      setSuccessMessage(`Loaded "${selected.name}" (${analysis.pageCount} pages, ${formatBytes(selected.size)})`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to parse PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Sample PDF for instantaneous testing
  const handleLoadSamplePdf = async () => {
    setIsLoading(true);
    try {
      const sampleDoc = await PDFDocument.create();
      const helvBold = await sampleDoc.embedFont(StandardFonts.HelveticaBold);
      const helv = await sampleDoc.embedFont(StandardFonts.Helvetica);

      // Page 1
      const page1 = sampleDoc.addPage([595.28, 841.89]);
      page1.drawText('CleanMeta — Privacy-First Document Suite', {
        x: 50,
        y: 780,
        size: 22,
        font: helvBold,
        color: rgb(0.1, 0.35, 0.8),
      });
      page1.drawText('Sample PDF Document for In-Browser Reading & Editing', {
        x: 50,
        y: 745,
        size: 13,
        font: helv,
        color: rgb(0.3, 0.3, 0.3),
      });

      page1.drawRectangle({
        x: 50,
        y: 690,
        width: 495,
        height: 35,
        color: rgb(0.93, 0.96, 1),
      });
      page1.drawText('STATUS: 100% Isolated Client-Side Execution (Zero Remote Telemetry)', {
        x: 65,
        y: 702,
        size: 11,
        font: helvBold,
        color: rgb(0.1, 0.4, 0.8),
      });

      const bodyParagraphs = [
        'Welcome to CleanMeta PDF Workspace. This document was generated directly in your browser using pure client-side WebAssembly routines. No data was transferred across any network.',
        'You can read through all paragraphs, search for keywords, switch between the Document View and the Clean Text Reader Mode, add annotations, draw your digital signature, apply blackout redaction boxes, and export.',
        'Security Notice: Embedded revision tags, author identifiers, and location coordinates are automatically sanitized upon export to ensure absolute confidentiality.',
      ];

      let curY = 640;
      for (const p of bodyParagraphs) {
        page1.drawText(p.slice(0, 85), { x: 50, y: curY, size: 11, font: helv, color: rgb(0.2, 0.2, 0.2) });
        if (p.length > 85) {
          page1.drawText(p.slice(85), { x: 50, y: curY - 18, size: 11, font: helv, color: rgb(0.2, 0.2, 0.2) });
          curY -= 18;
        }
        curY -= 35;
      }

      // Page 2
      const page2 = sampleDoc.addPage([595.28, 841.89]);
      page2.drawText('Section 2: Signatures & Document Verification', {
        x: 50,
        y: 780,
        size: 18,
        font: helvBold,
        color: rgb(0.1, 0.35, 0.8),
      });
      page2.drawText('This second page is ready for signature placement and confidential redaction stamps.', {
        x: 50,
        y: 750,
        size: 11,
        font: helv,
        color: rgb(0.3, 0.3, 0.3),
      });

      sampleDoc.setTitle('CleanMeta Sample Demonstration Document');
      sampleDoc.setAuthor('CleanMeta Sandbox Engine');

      const bytes = await sampleDoc.save();
      const sampleFile = new File([bytes.buffer as ArrayBuffer], 'CleanMeta_Sample_Document.pdf', {
        type: 'application/pdf',
      });
      await loadPdf(sampleFile);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not generate sample PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clipboard Paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const item = e.clipboardData.files[i];
          if (item.type === 'application/pdf') {
            e.preventDefault();
            loadPdf(item);
            break;
          } else if (item.type.startsWith('image/')) {
            if (currentTool === 'images-to-pdf') {
              e.preventDefault();
              setImageFiles((prev) => [...prev, item]);
            }
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [currentTool]);

  // Digital signature drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignatureDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = sigPenColor;
    ctx.lineWidth = sigPenWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureDrawing(false);
  };

  // Add elements in editor
  const handleAddTextElement = () => {
    if (!newTextContent.trim()) {
      setErrorMessage('Please type text to add to document.');
      return;
    }
    const newEl: PdfEditElement = {
      id: `text-${Date.now()}`,
      pageIndex: activeEditorPage,
      type: 'text',
      text: newTextContent.trim(),
      xPct: 15,
      yPct: 25 + editorElements.length * 8,
      size: newTextSize,
      color: newTextColor,
    };
    setEditorElements((prev) => [...prev, newEl]);
    setNewTextContent('');
    setSuccessMessage('Text placed on page. You can drag or save now.');
  };

  const handleAddStampElement = () => {
    const newEl: PdfEditElement = {
      id: `stamp-${Date.now()}`,
      pageIndex: activeEditorPage,
      type: 'stamp',
      text: newStampText,
      xPct: 30,
      yPct: 20 + editorElements.length * 10,
      size: 20,
      color: newStampColor,
    };
    setEditorElements((prev) => [...prev, newEl]);
    setSuccessMessage(`Stamp "${newStampText}" applied to page.`);
  };

  const handleAddRedactionElement = () => {
    const newEl: PdfEditElement = {
      id: `redact-${Date.now()}`,
      pageIndex: activeEditorPage,
      type: 'redaction',
      xPct: 20,
      yPct: 35,
      widthPct: redactionWidth,
      heightPct: redactionHeight,
    };
    setEditorElements((prev) => [...prev, newEl]);
    setSuccessMessage('Redaction blackout box applied to page.');
  };

  const handleAddSignatureElement = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignatureDrawing) {
      setErrorMessage('Please draw your signature on the pad first.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const newEl: PdfEditElement = {
      id: `sig-${Date.now()}`,
      pageIndex: activeEditorPage,
      type: 'signature',
      signatureDataUrl: dataUrl,
      xPct: 25,
      yPct: 65,
      widthPct: 35,
    };
    setEditorElements((prev) => [...prev, newEl]);
    setSuccessMessage('Signature placed on document page.');
  };

  const handleRemoveEditorElement = (id: string) => {
    setEditorElements((prev) => prev.filter((el) => el.id !== id));
  };

  // Save & Download Edited PDF
  const handleSaveEditedPdf = async () => {
    if (!file) {
      setErrorMessage('Please upload or load a PDF document first.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const pagesToKeep = pageOrder.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const editedBlob = await editAndExportPdf(file, pagesToKeep, editorElements, {
        scrubMetadata: true,
      });

      const filename = getCleanMetaFilename(file.name, 'pdf');
      const url = URL.createObjectURL(editedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage('Successfully exported edited PDF with all modifications!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to export edited PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reorder & Organize actions
  const handleRotatePage = (index: number) => {
    setPageOrder((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleRotateAll = (dir: 'left' | 'right') => {
    const delta = dir === 'right' ? 90 : 270;
    setPageOrder((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + delta) % 360 })));
  };

  const handleDeleteSelected = () => {
    const remaining = pageOrder.filter((p) => !p.selected);
    if (remaining.length === 0) {
      setErrorMessage('Cannot delete all pages in document.');
      return;
    }
    setPageOrder(remaining);
  };

  const handleExportOrganizedPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pagesToKeep = pageOrder.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));
      const blob = await organizePdf(file, pagesToKeep);
      const filename = getCleanMetaFilename(file.name, 'pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSuccessMessage('Successfully exported organized PDF!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Merge PDFs
  const handleMergePdfs = async () => {
    if (mergeFiles.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    try {
      const blob = await mergePdfs(mergeFiles);
      const filename = `CleanMeta_Merged_${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSuccessMessage(`Merged ${mergeFiles.length} PDF files successfully!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Images to PDF
  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) {
      setErrorMessage('Please select images to convert.');
      return;
    }
    setIsProcessing(true);
    try {
      const blob = await imagesToPdf(imageFiles, {
        pageSize: imagePageSize,
        orientation: imageOrientation,
      });
      const filename = `CleanMeta_Images_${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSuccessMessage(`Successfully converted ${imageFiles.length} images to PDF!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Compress PDF
  const handleCompressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await compressPdf(file, compressLevel);
      const filename = getCleanMetaFilename(file.name, 'pdf');
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSuccessMessage(
        `Optimized PDF! Size: ${formatBytes(res.originalSize)} → ${formatBytes(res.newSize)}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Protect & Sanitize
  const handleProtectPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const blob = await sanitizePdf(file, {
        scrubMetadata: scrubTimestamps,
        flattenForms,
      });
      const filename = getCleanMetaFilename(file.name, 'pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSuccessMessage('Exported hardened & sanitized PDF!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to protect PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy extracted text
  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download text
  const handleDownloadText = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '_extracted_text.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // High priority list of primary essential tools (Matches user request!)
  const primaryTabs: Array<{ id: PdfToolType; label: string; icon: any; badge?: string }> = [
    { id: 'pdf-viewer', label: 'PDF Viewer & Reader', icon: Eye, badge: 'Popular' },
    { id: 'pdf-editor', label: 'PDF Editor & Sign', icon: Edit3, badge: 'Essential' },
    { id: 'pdf-organize', label: 'Organize Pages', icon: Layers },
    { id: 'pdf-merge', label: 'Merge PDFs', icon: Plus },
    { id: 'pdf-compress', label: 'Compress PDF', icon: Percent },
    { id: 'pdf-protect', label: 'Protect & Lock', icon: Lock },
    { id: 'images-to-pdf', label: 'Images to PDF', icon: Images },
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left pb-16">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && loadPdf(e.target.files[0])}
      />
      <input
        ref={additionalPagesInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && loadPdf(e.target.files[0])}
      />
      <input
        ref={mergeInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
          }
        }}
      />
      <input
        ref={imagesInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
          }
        }}
      />

      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => handleSubToolChange('pdf-viewer')}
            className="hover:text-blue-600 transition"
          >
            Home
          </button>
          <span>›</span>
          <span className="text-slate-600 dark:text-slate-300">PDF Suite</span>
          <span>›</span>
          <span className="text-slate-900 dark:text-white font-bold capitalize">
            {currentTool.replace(/-/g, ' ')}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-semibold text-xs shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>100% In-Browser Engine: Isolated Sandbox (Zero Remote Telemetry)</span>
        </div>
      </div>

      {/* Headline & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>
              {currentTool === 'pdf-viewer' && 'PDF Document Viewer & Reader'}
              {currentTool === 'pdf-editor' && 'PDF Document Editor & Sign Suite'}
              {currentTool === 'pdf-organize' && 'PDF Page Organizer & Reorder'}
              {currentTool === 'pdf-merge' && 'Merge & Combine PDF Files'}
              {currentTool === 'pdf-compress' && 'Compress & Optimize PDF'}
              {currentTool === 'pdf-protect' && 'PDF Security, Flatten & Protect'}
              {currentTool === 'images-to-pdf' && 'Convert Images to PDF'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentTool === 'pdf-viewer' && 'Upload any PDF to immediately view, read text, zoom, search, and inspect client-side.'}
            {currentTool === 'pdf-editor' && 'Add custom text, place digital signatures, apply blackout redaction, and export modified PDF.'}
            {currentTool === 'pdf-organize' && 'Reorder, rotate, delete pages, and scrub metadata tags.'}
            {currentTool === 'pdf-merge' && 'Combine multiple PDF documents into a single unified file.'}
            {currentTool === 'pdf-compress' && 'Reduce PDF file size without sacrificing readability.'}
            {currentTool === 'pdf-protect' && 'Sanitize sensitive revision records and flatten interactive form fields.'}
            {currentTool === 'images-to-pdf' && 'Bundle JPG, PNG, and WebP images into a clean multi-page document.'}
          </p>
        </div>

        {/* Quick sample PDF button if no file loaded */}
        <div className="flex items-center gap-2 shrink-0">
          {!file && (
            <button
              onClick={handleLoadSamplePdf}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Load Sample PDF</span>
            </button>
          )}

          {file && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Essential Tools Tabs (Prominently in Front!) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubToolChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold transition shadow-2xs whitespace-nowrap cursor-pointer shrink-0 ${
                active
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600">
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PDF VIEWER & READER WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'pdf-viewer' && (
        <div className="flex flex-col gap-5">
          {!file ? (
            /* Big Click-Anywhere Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900/60 p-8 sm:p-14 text-center transition cursor-pointer shadow-sm hover:shadow-lg flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="max-w-md space-y-1">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                  Click anywhere or drag a PDF here to view
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Instantly open, read pages, extract text, and inspect metadata in memory.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  Supports Multi-page PDFs up to 500 MB
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Ctrl+V to paste anytime
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSamplePdf();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                >
                  Or Try Sample Document
                </button>
              </div>
            </div>
          ) : (
            /* Document Loaded: Active Viewer Controls & Display */
            <div className="flex flex-col gap-4">
              {/* Viewer Toolbar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{pdfAnalysis?.pageCount || 1} pages</span>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">Loaded in Memory</span>
                    </p>
                  </div>
                </div>

                {/* View Mode Switcher (Document vs Clean Text Reader) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setViewMode('document')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'document'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Document View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('reader')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'reader'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Reader &amp; Text Mode</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSubToolChange('pdf-editor')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open in Editor</span>
                  </button>

                  <button
                    onClick={() => {
                      if (fileBlobUrl) {
                        const a = document.createElement('a');
                        a.href = fileBlobUrl;
                        a.download = file.name;
                        a.click();
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Download Copy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content: Document Iframe or Text Reader */}
              {viewMode === 'document' && fileBlobUrl && (
                <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xl overflow-hidden min-h-[650px] sm:min-h-[750px]">
                  <iframe
                    src={`${fileBlobUrl}#view=FitH&toolbar=1`}
                    className="w-full h-full min-h-[650px] sm:min-h-[750px] border-0"
                    title="PDF Document Viewer"
                  />
                </div>
              )}

              {viewMode === 'reader' && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search word in document..."
                        value={textSearchQuery}
                        onChange={(e) => setTextSearchQuery(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyText}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
                      </button>

                      <button
                        onClick={handleDownloadText}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .txt</span>
                      </button>
                    </div>
                  </div>

                  {/* Extracted Text Body */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 max-h-[550px] overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text text-sm sm:text-base">
                    {extractedText || 'No text extracted. Document may be scanned or empty.'}
                  </div>
                </div>
              )}

              {/* Document Overview & Metadata Inspector Bar */}
              {pdfAnalysis && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pages &amp; Layout</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {pdfAnalysis.pageCount} Pages ({pdfAnalysis.pages[0]?.width || 595} × {pdfAnalysis.pages[0]?.height || 842} pt)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Producer / Engine</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {pdfAnalysis.producer || 'Standard PDF 1.7'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Creation Date</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {pdfAnalysis.creationDate ? pdfAnalysis.creationDate.toLocaleDateString() : 'Not stamped'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Privacy &amp; Telemetry</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero Remote Leaks</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PDF EDITOR & SIGN SUITE WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'pdf-editor' && (
        <div className="flex flex-col gap-5">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900/60 p-8 sm:p-14 text-center transition cursor-pointer shadow-sm hover:shadow-lg flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                  Upload a PDF to Edit, Sign &amp; Redact
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Add custom text, place digital signatures, draw redactions, and export locally.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSamplePdf();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700"
              >
                Or Open Sample Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Interactive Tools Palette (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Active Tool Mode Selector */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Editor Tools
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600">
                      Target: Page {activeEditorPage + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      onClick={() => setActiveEditorTool('text')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                        activeEditorTool === 'text'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      <span>Add Text</span>
                    </button>

                    <button
                      onClick={() => setActiveEditorTool('signature')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                        activeEditorTool === 'signature'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <PenTool className="w-4 h-4" />
                      <span>Draw Signature</span>
                    </button>

                    <button
                      onClick={() => setActiveEditorTool('redaction')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                        activeEditorTool === 'redaction'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Scissors className="w-4 h-4" />
                      <span>Redaction (Blackout)</span>
                    </button>

                    <button
                      onClick={() => setActiveEditorTool('stamp')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                        activeEditorTool === 'stamp'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Add Stamp</span>
                    </button>
                  </div>

                  {/* Tool-specific form settings */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Mode 1: Text Tool */}
                    {activeEditorTool === 'text' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">
                            Text Content:
                          </label>
                          <input
                            type="text"
                            placeholder="Type text to place (e.g. Approved by John Doe)..."
                            value={newTextContent}
                            onChange={(e) => setNewTextContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                              Font Size: {newTextSize}pt
                            </label>
                            <input
                              type="range"
                              min={10}
                              max={32}
                              value={newTextSize}
                              onChange={(e) => setNewTextSize(Number(e.target.value))}
                              className="w-full accent-blue-600"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                              Color:
                            </label>
                            <div className="flex items-center gap-1.5">
                              {['#1e293b', '#2563eb', '#dc2626', '#16a34a'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setNewTextColor(c)}
                                  className={`w-6 h-6 rounded-full border-2 transition ${
                                    newTextColor === c ? 'scale-110 border-blue-500' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleAddTextElement}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          + Place Text on Page {activeEditorPage + 1}
                        </button>
                      </div>
                    )}

                    {/* Mode 2: Signature Drawing Pad */}
                    {activeEditorTool === 'signature' && (
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-bold text-slate-500 block">
                          Draw Your Digital Signature:
                        </label>
                        <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-white overflow-hidden shadow-inner">
                          <canvas
                            ref={signatureCanvasRef}
                            width={320}
                            height={120}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-[120px] bg-white cursor-crosshair touch-none"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Color:</span>
                            {['#0f172a', '#1e40af'].map((c) => (
                              <button
                                key={c}
                                onClick={() => setSigPenColor(c)}
                                className={`w-5 h-5 rounded-full border-2 ${
                                  sigPenColor === c ? 'border-blue-500 scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>

                          <button
                            onClick={clearSignature}
                            className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                          >
                            Clear Pad
                          </button>
                        </div>

                        <button
                          onClick={handleAddSignatureElement}
                          disabled={!hasSignatureDrawing}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          + Place Signature on Page {activeEditorPage + 1}
                        </button>
                      </div>
                    )}

                    {/* Mode 3: Redaction Tool */}
                    {activeEditorTool === 'redaction' && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          Redaction creates permanent blackout rectangles over sensitive data (names, phone numbers, SSNs, financial figures).
                        </p>
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 block">
                            Box Width: {redactionWidth}%
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={80}
                            value={redactionWidth}
                            onChange={(e) => setRedactionWidth(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <button
                          onClick={handleAddRedactionElement}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          + Apply Blackout Redaction Box
                        </button>
                      </div>
                    )}

                    {/* Mode 4: Stamp Tool */}
                    {activeEditorTool === 'stamp' && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 block">
                          Select Stamp Preset:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {['CONFIDENTIAL', 'APPROVED', 'DRAFT', 'PAID', 'URGENT', 'ORIGINAL'].map((st) => (
                            <button
                              key={st}
                              onClick={() => setNewStampText(st)}
                              className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition ${
                                newStampText === st
                                  ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleAddStampElement}
                          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          + Place Stamp on Page {activeEditorPage + 1}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Placed Elements List */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Active Modifications ({editorElements.length})
                    </span>
                    {editorElements.length > 0 && (
                      <button
                        onClick={() => setEditorElements([])}
                        className="text-rose-500 text-[11px] hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {editorElements.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      No modifications placed yet. Use the tools above to add elements.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {editorElements.map((el) => (
                        <div
                          key={el.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                              {el.type}: {el.text || (el.type === 'signature' ? 'Signature' : 'Blackout')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Page {el.pageIndex + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveEditorElement(el.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Action: Save and Download */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveEditedPdf}
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isProcessing ? 'Compiling PDF...' : 'Save & Download Edited PDF'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Page Workspace (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {/* Page Navigation Header */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveEditorPage((p) => Math.max(0, p - 1))}
                      disabled={activeEditorPage === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Page {activeEditorPage + 1} of {pageOrder.length || 1}
                    </span>
                    <button
                      onClick={() => setActiveEditorPage((p) => Math.min(pageOrder.length - 1, p + 1))}
                      disabled={activeEditorPage >= pageOrder.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => handleRotatePage(activeEditorPage)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-semibold"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate Page</span>
                    </button>
                  </div>
                </div>

                {/* Visual Page Canvas with Overlays */}
                <div className="relative w-full aspect-[1/1.4] max-w-xl mx-auto rounded-2xl bg-white border border-slate-300 dark:border-slate-700 shadow-2xl p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
                  {/* Subtle watermarked document layout */}
                  <div className="space-y-4 select-none opacity-85">
                    <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                    <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    <div className="h-3 w-4/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 rounded" />
                    </div>
                  </div>

                  {/* Overlays Placed on Active Page */}
                  {editorElements
                    .filter((el) => el.pageIndex === activeEditorPage)
                    .map((el) => {
                      if (el.type === 'text') {
                        return (
                          <div
                            key={el.id}
                            className="absolute p-1.5 rounded border border-dashed border-blue-400 bg-white/80 shadow-xs cursor-move flex items-center gap-2 group"
                            style={{
                              left: `${el.xPct}%`,
                              top: `${el.yPct}%`,
                              color: el.color || '#1e293b',
                              fontSize: `${el.size || 16}px`,
                              fontWeight: 'bold',
                            }}
                          >
                            <span>{el.text}</span>
                            <button
                              onClick={() => handleRemoveEditorElement(el.id)}
                              className="text-rose-500 opacity-0 group-hover:opacity-100 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }
                      if (el.type === 'stamp') {
                        return (
                          <div
                            key={el.id}
                            className="absolute px-3 py-1.5 rounded-lg border-2 border-rose-600 bg-rose-50/90 text-rose-700 font-extrabold uppercase shadow-sm flex items-center gap-2 group"
                            style={{
                              left: `${el.xPct}%`,
                              top: `${el.yPct}%`,
                              fontSize: `${el.size || 20}px`,
                            }}
                          >
                            <span>{el.text}</span>
                            <button
                              onClick={() => handleRemoveEditorElement(el.id)}
                              className="text-rose-600 opacity-0 group-hover:opacity-100 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }
                      if (el.type === 'redaction') {
                        return (
                          <div
                            key={el.id}
                            className="absolute bg-black rounded shadow-md group flex items-center justify-end p-1"
                            style={{
                              left: `${el.xPct}%`,
                              top: `${el.yPct}%`,
                              width: `${el.widthPct || 35}%`,
                              height: `${el.heightPct || 6}%`,
                            }}
                          >
                            <button
                              onClick={() => handleRemoveEditorElement(el.id)}
                              className="text-white opacity-0 group-hover:opacity-100 text-[10px] px-1 bg-rose-600 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }
                      if (el.type === 'signature' && el.signatureDataUrl) {
                        return (
                          <div
                            key={el.id}
                            className="absolute p-1 border border-dashed border-blue-500 rounded bg-white/70 group"
                            style={{
                              left: `${el.xPct}%`,
                              top: `${el.yPct}%`,
                              width: `${el.widthPct || 35}%`,
                            }}
                          >
                            <img src={el.signatureDataUrl} alt="Signature" className="w-full h-auto" />
                            <button
                              onClick={() => handleRemoveEditorElement(el.id)}
                              className="absolute -top-2 -right-2 text-rose-500 bg-white rounded-full p-0.5 shadow text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}

                  {/* Document Footer */}
                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 select-none">
                    <span>CleanMeta Client-Side Document Workspace</span>
                    <span>Page {activeEditorPage + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ORGANIZE & PAGES WORKSPACE (Reorder, Rotate, Delete) */}
      {/* ============================================================== */}
      {currentTool === 'pdf-organize' && (
        <div className="flex flex-col gap-5">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900/60 p-8 sm:p-14 text-center transition cursor-pointer shadow-sm hover:shadow-lg flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Layers className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                  Upload PDF to Organize Pages
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Reorder sheets, rotate orientations, and remove unwanted pages.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSamplePdf();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Or Open Sample Document
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Toolbar */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotateAll('left')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rotate All Left</span>
                  </button>

                  <button
                    onClick={() => handleRotateAll('right')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate All Right</span>
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>

                <button
                  onClick={handleExportOrganizedPdf}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Organized PDF</span>
                </button>
              </div>

              {/* Pages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pageOrder.map((page, index) => (
                  <div
                    key={page.id}
                    className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border transition flex flex-col justify-between gap-2 shadow-xs ${
                      page.selected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]">
                        Page {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRotatePage(index)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <input
                          type="checkbox"
                          checked={page.selected}
                          onChange={() =>
                            setPageOrder((prev) =>
                              prev.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
                            )
                          }
                          className="accent-blue-600"
                        />
                      </div>
                    </div>

                    <div
                      className="w-full aspect-[3/4] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center p-3 text-center"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    >
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {page.title}
                      </span>
                      {page.rotation !== 0 && (
                        <span className="text-[9px] text-blue-600 font-mono mt-0.5">
                          {page.rotation}°
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MERGE PDFS WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'pdf-merge' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Selected Documents to Combine ({mergeFiles.length})
              </h3>
              <p className="text-xs text-slate-500">
                Add multiple files and order them sequentially.
              </p>
            </div>
            <button
              onClick={() => mergeInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add PDF Files</span>
            </button>
          </div>

          {mergeFiles.length === 0 ? (
            <div
              onClick={() => mergeInputRef.current?.click()}
              className="p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <UploadCloud className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click anywhere or drop multiple PDFs here to combine
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {mergeFiles.map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {f.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">{formatBytes(f.size)}</span>
                  </div>
                  <button
                    onClick={() => setMergeFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="pt-3">
                <button
                  onClick={handleMergePdfs}
                  disabled={mergeFiles.length < 2 || isProcessing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Merging Documents...' : `Merge & Download (${mergeFiles.length} files)`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. COMPRESS PDF WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'pdf-compress' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Percent className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click anywhere to select a PDF to optimize &amp; compress
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-bold">{file.name}</span>
                <span className="text-slate-500">{formatBytes(file.size)}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { id: 'minimal', title: 'Light (Lossless)', sub: 'Fastest, preserves all vectors' },
                  { id: 'balanced', title: 'Recommended Balanced', sub: 'Best balance for email & web' },
                  { id: 'high', title: 'Maximum (-65% est.)', sub: 'Great for archiving & portals' },
                ].map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCompressLevel(c.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      compressLevel === c.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold text-slate-900 dark:text-white block">{c.title}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{c.sub}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCompressPdf}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Optimizing...' : 'Compress & Export PDF'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PROTECT & ENCRYPT WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'pdf-protect' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Lock className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click anywhere to select a PDF to sanitize and protect
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={scrubTimestamps}
                    onChange={(e) => setScrubTimestamps(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <span>Scrub all author, creator software, GPS, and timestamp revision history</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={flattenForms}
                    onChange={(e) => setFlattenForms(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <span>Flatten all interactive form fields (prevents post-export alterations)</span>
                </label>
              </div>

              <button
                onClick={handleProtectPdf}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Hardening...' : 'Sanitize & Protect PDF'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. IMAGES TO PDF WORKSPACE */}
      {/* ============================================================== */}
      {currentTool === 'images-to-pdf' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Selected Photos ({imageFiles.length})
              </h3>
              <p className="text-xs text-slate-500">
                Convert photos (JPG, PNG, WebP) into a high-res PDF.
              </p>
            </div>
            <button
              onClick={() => imagesInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Images</span>
            </button>
          </div>

          {imageFiles.length === 0 ? (
            <div
              onClick={() => imagesInputRef.current?.click()}
              className="p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Images className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click anywhere or drop images to convert into PDF
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {imageFiles.map((img, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="truncate max-w-[120px] font-bold">{img.name}</span>
                    <button
                      onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-rose-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleConvertImagesToPdf}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Converting...' : `Convert ${imageFiles.length} Images to PDF`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
