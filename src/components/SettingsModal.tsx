import React from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Shield,
  Clock,
  Trash2,
  LogOut,
  User,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { RetentionPreference, UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  retentionPreference: RetentionPreference;
  onSelectRetention: (retention: RetentionPreference) => void;
  user: UserProfile | null;
  onSignOut: () => void;
  onClearLocalVault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  retentionPreference,
  onSelectRetention,
  user,
  onSignOut,
  onClearLocalVault,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Settings & Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Theme Switcher */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                }}
                className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition ${
                  !darkMode
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </button>
              <button
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                }}
                className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition ${
                  darkMode
                    ? 'border-blue-600 bg-blue-950/60 text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Theme</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Retention Preference */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1 flex items-center justify-between">
              <span>Cloud Storage Retention TTL</span>
              <span className="text-teal-600 font-bold">{retentionPreference}</span>
            </label>
            <p className="text-slate-500 text-[11px] mb-2">
              Processed outputs stored in Vercel Blob auto-purge after this expiration window.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'none', label: 'Local Only' },
                { id: '1day', label: '1 Day' },
                { id: '2days', label: '2 Days' },
                { id: '3days', label: '3 Days' },
                { id: '4days', label: '4 Days' },
                { id: '7days', label: '7 Days' },
              ].map((ret) => (
                <button
                  key={ret.id}
                  onClick={() => onSelectRetention(ret.id as RetentionPreference)}
                  className={`py-2 px-1 text-center rounded-lg font-semibold transition border ${
                    retentionPreference === ret.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {ret.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Account status */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              User Account & Identity
            </label>
            {user ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                      {user.displayName || 'CleanMeta User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-semibold text-xs flex items-center gap-1 hover:bg-rose-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-center">
                Operating in anonymous Local RAM mode.
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Reset Cache / Local Vault */}
          <div>
            <label className="block font-bold text-rose-600 uppercase tracking-wider text-[11px] mb-1">
              Danger Zone
            </label>
            <button
              onClick={() => {
                if (window.confirm('Clear all local session files and processing history?')) {
                  onClearLocalVault();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Local Session Storage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
