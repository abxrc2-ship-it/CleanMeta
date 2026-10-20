import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, ClipboardPaste, AlertCircle, FileType } from 'lucide-react';
import { validateImageFile } from '../lib/metadata';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  // Validate and emit files
  const handleProcessFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setErrorMessage(null);
      setClipboardNotice(null);

      const files = Array.from(fileList);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      const errorList: string[] = [];

      for (const file of files) {
        const validation = await validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errorList.push(`"${file.name}": ${validation.error || 'Invalid image file.'}`);
        }
      }

      if (errorList.length > 0) {
        setErrorMessage(
          errorList.length === 1
            ? errorList[0]
            : `${errorList.length} files were skipped. ${errorList[0]}`
        );
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected]
  );

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Global paste handler (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
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
              const extension = item.type.split('/')[1] || 'png';
              const file = new File(
                [blob],
                `pasted-photo-${Date.now()}.${extension}`,
                { type: item.type }
              );
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          handleProcessFiles(imageFiles);
          setClipboardNotice('Pasted photo from clipboard successfully!');
          setTimeout(() => setClipboardNotice(null), 4000);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleProcessFiles]);

  // Clickable clipboard button for mobile & accessible users
  const handleClipboardButtonClick = async () => {
    setErrorMessage(null);
    setClipboardNotice(null);

    if (!navigator.clipboard || !navigator.clipboard.read) {
      setErrorMessage(
        'Direct clipboard read is not supported on this browser. On desktop, press Ctrl+V / Cmd+V. On mobile devices, tap "Choose Photos" and pick from your Photo Library.'
      );
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of items) {
        // Look for image types
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File(
            [blob],
            `clipboard-photo-${Date.now()}.${ext}`,
            { type: imageType }
          );
          files.push(file);
        }
      }

      if (files.length > 0) {
        handleProcessFiles(files);
        setClipboardNotice('Image loaded from clipboard!');
        setTimeout(() => setClipboardNotice(null), 4000);
      } else {
        setErrorMessage(
          'No image found in clipboard. Copy an image first, or press "Choose Photos" to upload from your files.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        'Clipboard access was denied or not supported by this browser. Use the "Choose Photos" button or paste using keyboard shortcuts.'
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Drop Target Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-10 transition-all text-center ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.008]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600'
        } shadow-sm`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleProcessFiles(e.target.files);
            }
            // Reset input value so same files can be chosen again if removed
            e.target.value = '';
          }}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          {/* Animated upload icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
              isDragOver
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
            {isDragOver ? 'Drop photos here' : 'Drag & drop photos or choose files'}
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Supports <strong className="text-slate-700 dark:text-slate-300">JPG, PNG, WebP</strong> up to 25 MB each.
          </p>

          {/* Primary Action Button */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose Photos</span>
            </button>

            <button
              type="button"
              onClick={handleClipboardButtonClick}
              disabled={isProcessing}
              title="Paste image currently in your system clipboard"
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ClipboardPaste className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Paste from Clipboard</span>
            </button>
          </div>

          {/* Instructions note */}
          <div className="mt-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              V
            </kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              ⌘
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              V
            </kbd>
            <span>also pastes directly on desktop.</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {clipboardNotice && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
          <FileType className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{clipboardNotice}</span>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to add file</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
