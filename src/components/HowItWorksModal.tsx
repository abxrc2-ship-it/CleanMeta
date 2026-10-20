import React from 'react';
import { X, Cpu, ShieldCheck, CheckCircle2, Lock, FileSearch, Download } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 id="how-it-works-title" className="text-base font-bold text-slate-900 dark:text-white">
              How CleanMeta Works
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-sm">
          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Zero Server Uploads</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                All image decoding, metadata parsing, and pixel re-encoding occurs strictly inside your browser’s local sandbox. No photo bits or metadata tags are ever sent over a network.
              </p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Client-Side Selection & Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  You select files or paste an image from your clipboard. CleanMeta inspects the binary magic bytes (JPEG, PNG, WebP) to confirm the file is valid and within the 25 MB safety limit.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Metadata Extraction & Threat Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  CleanMeta analyzes the file’s APP headers using a local parser. It identifies sensitive markers: GPS latitude/longitude, camera model, lens serials, capture timestamps, IPTC captions, and Photoshop history.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Hardware-Accelerated Canvas Re-Encoding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Rather than just editing a text header, CleanMeta decodes the raw image pixels into an in-memory HTML5 Canvas and exports a fresh, pristine image blob. This naturally leaves behind all EXIF and GPS markers. Transparency is preserved for PNG/WebP files, and high-fidelity 95% quality is maintained for JPEGs.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Independent Verification Pass
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Before presenting the download, CleanMeta executes an independent validation pass on the re-encoded blob to confirm that 0 GPS, camera, or embedded tags remain in the file structure.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                5
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Instant Download or ZIP Archive
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Download cleaned images individually or batch export all processed photos in a single ZIP file. Your original files on your computer or phone are never modified or overwritten.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
