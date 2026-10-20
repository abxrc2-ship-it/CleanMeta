import React, { useState } from 'react';
import {
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  LogIn,
  Shield,
  HelpCircle,
  RefreshCw,
  Minimize2,
  History,
  Scissors,
  Wifi,
  WifiOff,
  Cloud,
} from 'lucide-react';
import { ToolType, UserProfile } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: UserProfile | null;
  activeTab: ToolType | 'history';
  onTabChange: (tab: ToolType | 'history') => void;
  onOpenAccount: () => void;
  onOpenHowItWorks: () => void;
  onOpenPrivacy: () => void;
  onOpenAuth: () => void;
  isOnline?: boolean;
  activeMode?: 'local' | 'cloud';
  onToggleMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  user,
  activeTab,
  onTabChange,
  onOpenAccount,
  onOpenHowItWorks,
  onOpenPrivacy,
  onOpenAuth,
  isOnline = true,
  activeMode = 'local',
  onToggleMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange('metadata-remover')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                CleanMeta
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Privacy Photo Utilities
            </p>
          </div>
        </div>

        {/* Primary Tool Switcher (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => onTabChange('metadata-remover')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'metadata-remover'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Metadata Remover</span>
          </button>
          <button
            onClick={() => onTabChange('bg-remover')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bg-remover'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>BG Remover</span>
          </button>
          <button
            onClick={() => onTabChange('converter')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Converter</span>
          </button>
          <button
            onClick={() => onTabChange('compressor')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compressor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Compressor</span>
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Online / Offline Mode Toggle */}
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              title={
                !isOnline
                  ? 'ইন্টারনেট সংযোগ নেই: লোকাল অফলাইন মোডে নির্বিঘ্নে কাজ চলছে'
                  : activeMode === 'local'
                  ? 'বর্তমানে লোকাল অফলাইন মোড সক্রিয় (১০০% প্রাইভেট)। ক্লাউড মোডে যেতে ক্লিক করুন।'
                  : 'বর্তমানে ক্লাউড স্টোরেজ মোড সক্রিয়। লোকাল অফলাইন মোডে যেতে ক্লিক করুন।'
              }
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                !isOnline
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : activeMode === 'local'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>অফলাইন মোড</span>
                </>
              ) : activeMode === 'local' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>লোকাল অফলাইন</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>ক্লাউড সিঙ্ক</span>
                </>
              )}
            </button>
          )}

          {/* How It Works & Privacy buttons for desktop */}
          <button
            onClick={onOpenHowItWorks}
            title="How It Works"
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPrivacy}
            title="Privacy Policy"
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Authentication Button / User Avatar */}
          {user ? (
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              title="Account settings"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              <span className="max-w-[100px] truncate text-slate-800 dark:text-slate-200 text-xs font-bold">
                {user.displayName || user.email?.split('@')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition text-xs font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন / সাইন আপ</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Subheader Tool Switcher on Tablet & Mobile */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800/80 px-1 py-1.5 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold">
        <button
          onClick={() => onTabChange('metadata-remover')}
          className={`py-1.5 px-2 rounded-lg transition flex items-center gap-1 ${
            activeTab === 'metadata-remover'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Remover</span>
        </button>
        <button
          onClick={() => onTabChange('bg-remover')}
          className={`py-1.5 px-2 rounded-lg transition flex items-center gap-1 ${
            activeTab === 'bg-remover'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>BG Cut</span>
        </button>
        <button
          onClick={() => onTabChange('converter')}
          className={`py-1.5 px-2 rounded-lg transition flex items-center gap-1 ${
            activeTab === 'converter'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Convert</span>
        </button>
        <button
          onClick={() => onTabChange('compressor')}
          className={`py-1.5 px-2 rounded-lg transition flex items-center gap-1 ${
            activeTab === 'compressor'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Compress</span>
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`py-1.5 px-2 rounded-lg transition flex items-center gap-1 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenHowItWorks();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            How It Works
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPrivacy();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            Privacy Policy
          </button>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span>Account ({user.displayName || user.email})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন / সাইন আপ</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
