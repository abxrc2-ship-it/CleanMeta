import React, { useState } from 'react';
import { Video, Film, Share2, Bell, CheckCircle2, ShieldCheck, Sparkles, Clock } from 'lucide-react';

export const VideoComingSoon: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-6">
        <Clock className="w-4 h-4 text-violet-600" />
        <span>Roadmap Q2 2026 • Local WASM Video Pipeline</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Video Privacy Tools <span className="text-violet-600 dark:text-violet-400">Coming Soon</span>
      </h1>

      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
        We are engineering ultra-fast, 100% in-browser WebAssembly video processing with zero server uploads for total metadata privacy.
      </p>

      {/* 3 Upcoming Tools Cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 flex items-center justify-center mb-3">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Video Editor & Redactor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Frame-accurate trimming, metadata scrubbing, and face/license blur running in client memory.
            </p>
          </div>
          <span className="mt-4 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold self-start uppercase tracking-wider">
            In Development
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 flex items-center justify-center mb-3">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Compare Videos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Synchronized side-by-side playback to evaluate bitrate compression and visual artifacts.
            </p>
          </div>
          <span className="mt-4 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold self-start uppercase tracking-wider">
            In Design
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Extract Video Streams</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Demux MP4, MKV, and WebM containers to extract pure AAC audio, subtitles, or raw video streams.
            </p>
          </div>
          <span className="mt-4 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold self-start uppercase tracking-wider">
            Planned
          </span>
        </div>
      </div>

      {/* Notify form */}
      <div className="mt-10 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
          Be notified when Video Tools launch
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Zero spam. Only an email notification when the WASM video engine is live.
        </p>

        {subscribed ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Thank you! We will notify you at launch.</span>
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notify Me</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
