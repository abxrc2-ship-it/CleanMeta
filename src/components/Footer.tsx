import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenHowItWorks: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHowItWorks,
  onOpenPrivacy,
}) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors py-10 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">CleanMeta</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Remove Metadata. Protect Your Privacy.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>100% in-browser processing. Zero server uploads.</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <button
            onClick={onOpenHowItWorks}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center md:text-right">
          <p>© {new Date().getFullYear()} CleanMeta. Open Source Privacy Utility.</p>
          <p className="text-[11px] mt-0.5">Compatible with modern mobile & desktop browsers.</p>
        </div>
      </div>
    </footer>
  );
};
