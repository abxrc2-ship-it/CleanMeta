import React from 'react';
import { ShieldCheck, Lock, UserCheck } from 'lucide-react';

interface FooterProps {
  onOpenHowItWorks: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHowItWorks,
  onOpenPrivacy,
}) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-black transition-colors py-10 px-4 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand, Mission & Founder Credit */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white">CleanMeta</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-neutral-800 text-blue-800 dark:text-cyan-400 text-[10px] font-mono font-bold">
              v4.2.5
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Privacy-First Metadata Stripper &amp; Document Security Suite.
          </p>

          {/* Founder Credit (Explicitly requested by user!) */}
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Founder &amp; Developer:</span>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-wide text-xs">
              Rayhan Chowdhury
            </span>
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>100% in-browser processing. Zero server uploads.</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-neutral-400">
          <button
            onClick={onOpenHowItWorks}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 dark:text-neutral-500 text-center md:text-right">
          <p>© {new Date().getFullYear()} CleanMeta • Founded by Rayhan Chowdhury</p>
          <p className="text-[11px] mt-0.5">Compatible with modern mobile &amp; desktop browsers.</p>
        </div>
      </div>
    </footer>
  );
};
