import React from 'react';
import { ShieldCheck, HelpCircle, Lock, Cpu, ServerOff, CheckCircle2 } from 'lucide-react';

export const HelpAboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About CleanMeta &amp; Security Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2">
          Founded &amp; Developed by <strong>Rayhan Chowdhury</strong> — A 100% client-side privacy tool suite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ServerOff className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Zero Server Telemetry</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            By default, all image re-encoding, EXIF stripping, and PDF assembly occurs purely within your browser's local RAM memory.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <Cpu className="w-8 h-8 text-teal-600 mb-3" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">WASM 64-Bit Deflate</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Compiled WebAssembly modules execute native-speed rasterization, JPEG/WebP compression, and font/stream parsing in milliseconds.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <Lock className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Scoped Temporary Storage</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            If cloud persistence is enabled, outputs are protected by authenticated Firebase UID tokens with an enforced 1–7 day auto-purge TTL.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-5">
        <h2 className="font-bold text-base text-slate-900 dark:text-white">Frequently Asked Questions</h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Which image formats are supported for metadata removal?
            </h4>
            <p className="text-slate-500 mt-0.5 leading-relaxed">
              CleanMeta supports JPEG/JPG, PNG, WebP, and Apple HEIC/HEIF files up to 25MB each.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Does CleanMeta compress or reduce visual quality when stripping metadata?
            </h4>
            <p className="text-slate-500 mt-0.5 leading-relaxed">
              No. When using Metadata Remover, original pixel dimensions and aspect ratios are 100% preserved. For PNG images, re-encoding is completely lossless.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Can I reorder, rotate, or delete individual pages in a PDF?
            </h4>
            <p className="text-slate-500 mt-0.5 leading-relaxed">
              Yes. The Organize PDF Pages tool offers a visual interactive grid allowing you to rotate any page by 90°, delete unwanted pages, and export a sanitized document.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Can I paste images directly from my clipboard?
            </h4>
            <p className="text-slate-500 mt-0.5 leading-relaxed">
              Yes! Use Ctrl+V (or Cmd+V on macOS) anywhere on the website to immediately queue and process screenshot or copied photos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
