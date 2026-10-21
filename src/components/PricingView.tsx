import React from 'react';
import { Check, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const PricingView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Simple, Transparent <span className="text-blue-600 dark:text-blue-400">Pricing</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
          100% of core privacy processing runs free forever in your browser. Upgrade only if you need multi-device cloud vaults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Local Free</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Forever
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-500">/ forever</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Complete privacy suite executing 100% in local memory with zero tracking.
            </p>

            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All 7 Image Tools (Metadata Remover, Resizer, Converter, Compressor)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All 14 PDF Tools (Organize, Merge, Split, Editor, OCR)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero server telemetry & unlimited file operations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>High-speed WASM 64-bit engine</span>
              </li>
            </ul>
          </div>

          <button className="mt-8 w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition">
            Current Active Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-md flex flex-col justify-between relative">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
            Recommended
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Pro Vault</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                Cloud Sync
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$9</span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              For teams and high-volume creators requiring temporary encrypted cloud storage.
            </p>

            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Everything in Local Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Vercel Blob temporary storage retention up to 7 days</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Multi-device history sync via Firestore</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Batch conversion up to 100 images per batch</span>
              </li>
            </ul>
          </div>

          <button className="mt-8 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition">
            Start Pro 7-Day Trial
          </button>
        </div>
      </div>
    </div>
  );
};
