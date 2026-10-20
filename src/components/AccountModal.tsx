import React from 'react';
import { X, User as UserIcon, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { signOutUser } from '../lib/firebase';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="account-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
            User Account
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="w-20 h-20 rounded-full border-2 border-blue-500 shadow-md object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                <UserIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user.displayName || 'Google User'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user.email || 'No email attached'}
            </p>
          </div>

          {/* Privacy clarification notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Zero-Storage Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Photos you process with CleanMeta are never linked, saved, or uploaded to this Google account. Authentication is optional and provides personal session status only.
            </p>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
