import React from 'react';
import { ShieldCheck, MapPinOff, Camera, EyeOff, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="pt-8 pb-6 sm:pt-12 sm:pb-8 text-center px-4 max-w-4xl mx-auto">
      {/* Privacy Guarantee Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium mb-5 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Your photos stay on your device during processing</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
        Remove Photo Metadata <span className="text-blue-600 dark:text-blue-400">in Seconds</span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Clean location, camera, date, and other supported metadata from your photos.
        Process images privately in your browser without uploading to any external server.
      </p>

      {/* Feature Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <MapPinOff className="w-3.5 h-3.5 text-rose-500" />
          <span>Strips GPS Coordinates</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Camera className="w-3.5 h-3.5 text-amber-500" />
          <span>Purges Camera & Lens EXIF</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <EyeOff className="w-3.5 h-3.5 text-indigo-500" />
          <span>Removes XMP & IPTC Tags</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Preserves Full Resolution</span>
        </div>
      </div>
    </section>
  );
};
