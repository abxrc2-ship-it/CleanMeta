import React from 'react';
import { X, Shield, Check, Lock, Database, Trash2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
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
              <Shield className="w-4 h-4" />
            </div>
            <h2 id="privacy-policy-title" className="text-base font-bold text-slate-900 dark:text-white">
              CleanMeta Privacy Policy
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Core Privacy Principle
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5">
                CleanMeta is built strictly on the principle of client-side data isolation. Your photos never leave your device.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-blue-600" />
              1. Local Browser Processing
            </h3>
            <p>
              When you select, drop, or paste a photo, the image data is decoded solely within your web browser’s memory using the HTML5 Canvas API and JavaScript. CleanMeta does not transmit your images or their embedded metadata to any remote backend server, cloud bucket, or external API during processing.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              2. No Image Storage or Databases
            </h3>
            <p>
              This application does not store, database, or archive your photos. There is no cloud media library. When you reload or close the tab, all in-memory photo representations and temporary blob URLs are discarded.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" />
              3. Optional Firebase Authentication
            </h3>
            <p>
              Google Sign-In is completely optional. If configured and you choose to sign in, Firebase Authentication is used exclusively to maintain your profile state (display name, email, and avatar). Your authenticated account has no access to or storage of your photos, and you may use all photo-cleaning capabilities as an unauthenticated guest.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-blue-600" />
              4. Temporary Memory & Object URLs
            </h3>
            <p>
              CleanMeta promptly revokes temporary `blob:` URLs when images are removed from the queue or replaced to ensure minimal memory retention. We avoid storing raw images in `localStorage` or `sessionStorage`.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              5. Technical Limitations & Disclaimers
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              While browser canvas re-encoding strips common EXIF markers, GPS coordinates, camera models, and IPTC/XMP tags from supported JPEG, PNG, and WebP files, it is not a legal guarantee of anonymity against all forensic digital steganography or non-standard file formats. CleanMeta is provided as an open-source privacy utility.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
