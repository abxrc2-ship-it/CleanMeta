import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Cloud,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Sun,
  Sliders,
  Save,
  Trash2,
  RefreshCw,
  LogOut,
  LogIn,
  Server,
  Zap,
  Layers,
  ArrowRight,
  DatabaseZap,
  Globe,
  Camera,
  MapPinOff,
  Cpu,
  Gift,
  Upload,
} from 'lucide-react';
import {
  UserProfile,
  RetentionPreference,
  CleanFormatPreference,
} from '../types';
import {
  updateUserProfileInfo,
  updateUserEmail,
  updateUserPassword,
  signOutUser,
  getUserAuthProvider,
} from '../lib/firebase';
import {
  getLocalVaultFiles,
  calculateStorageUsage,
  purgeExpiredFiles,
  clearEntireVault,
  VaultFileItem,
} from '../lib/cloudVaultManager';
import { formatBytes } from '../lib/imageProcessor';
import {
  getUserSubscription,
  redeemPromoCode,
  SubscriptionStatus,
} from '../lib/subscription';
import { getRemainingOperations } from '../lib/dailyLimits';

interface AccountSettingsViewProps {
  user: UserProfile | null;
  onUserUpdate: (updated: UserProfile | null) => void;
  onOpenAuth: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  storageMode: 'local' | 'cloud';
  onChangeStorageMode: (mode: 'local' | 'cloud') => void;
  retentionPreference: RetentionPreference;
  onChangeRetentionPreference: (retention: RetentionPreference) => void;
  formatPreference: CleanFormatPreference;
  onChangeFormatPreference: (format: CleanFormatPreference) => void;
  onClearLocalVault: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
];

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  user,
  onUserUpdate,
  onOpenAuth,
  darkMode,
  onToggleDarkMode,
  storageMode,
  onChangeStorageMode,
  retentionPreference,
  onChangeRetentionPreference,
  formatPreference,
  onChangeFormatPreference,
  onClearLocalVault,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'storage' | 'privacy' | 'theme' | 'data'
  >('profile');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form states for profile
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || '');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Voucher redeem state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>(() => getUserSubscription());

  // Loading and messages
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Storage files state
  const [vaultFiles, setVaultFiles] = useState<VaultFileItem[]>([]);
  const [purgedCountNotice, setPurgedCountNotice] = useState<string | null>(null);

  // Privacy scrubbing options
  const [stripGps, setStripGps] = useState(true);
  const [stripExif, setStripExif] = useState(true);
  const [stripAiTags, setStripAiTags] = useState(true);
  const [preserveSrgb, setPreserveSrgb] = useState(true);

  const authProvider = getUserAuthProvider();
  const dailyLimits = getRemainingOperations(storageMode);

  // Load vault files on mount
  const refreshStorage = () => {
    const purged = purgeExpiredFiles();
    if (purged > 0) {
      setPurgedCountNotice(`${purged} expired file(s) automatically cleaned.`);
      setTimeout(() => setPurgedCountNotice(null), 4000);
    }
    const current = getLocalVaultFiles();
    setVaultFiles(current);
  };

  useEffect(() => {
    refreshStorage();
  }, [user]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setAvatarUrl(user.photoURL || '');
    }
  }, [user]);

  const storageUsage = calculateStorageUsage(vaultFiles);
  const usagePercentage = Math.min(
    100,
    parseFloat(((storageUsage.usedBytes / storageUsage.totalBytes) * 100).toFixed(2))
  );

  // Handle Display Name & Avatar Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!displayName.trim()) {
      setProfileMessage({ type: 'error', text: 'Display Name cannot be empty.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updated = await updateUserProfileInfo(displayName.trim(), avatarUrl);
      onUserUpdate(updated);
      setProfileMessage({ type: 'success', text: 'Profile & Avatar updated successfully!' });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Local Photo Avatar Upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Email Update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!email.trim() || email.trim() === user.email) {
      setEmailMessage({ type: 'error', text: 'Please enter a new, different email address.' });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const updated = await updateUserEmail(email.trim(), currentPasswordForEmail);
      onUserUpdate(updated);
      setCurrentPasswordForEmail('');
      setEmailMessage({ type: 'success', text: 'Email address updated successfully!' });
      setTimeout(() => setEmailMessage(null), 4000);
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword, currentPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Voucher Redemption
  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMessage(null);

    if (!promoCodeInput.trim()) {
      setPromoMessage({ type: 'error', text: 'Enter a valid voucher or promo code.' });
      return;
    }

    const res = redeemPromoCode(promoCodeInput);
    if (res.success && res.status) {
      setSubStatus(res.status);
      setPromoMessage({ type: 'success', text: res.message });
      setPromoCodeInput('');
    } else {
      setPromoMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    await signOutUser();
    onUserUpdate(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-left">
      {/* Hidden Avatar File Input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* HEADER WITH SERVER / LOCAL STATUS SWITCHER (No "Green"/"Red" text) */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Account &amp; System Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                Manage profile avatar, email/password, storage quota ({subStatus.storageQuotaMB} MB), and daily limits.
              </p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SERVER / LOCAL SANDBOX TOGGLE (No literal Green/Red words) */}
        <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => onChangeStorageMode('local')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              storageMode === 'local'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`inline-flex h-full w-full rounded-full ${
                  storageMode === 'local' ? 'bg-white animate-ping opacity-75' : 'bg-emerald-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  storageMode === 'local' ? 'bg-white' : 'bg-emerald-500'
                }`}
              ></span>
            </span>
            <span>Local Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeStorageMode('cloud')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              storageMode === 'cloud'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`inline-flex h-full w-full rounded-full ${
                  storageMode === 'cloud' ? 'bg-white animate-ping opacity-75' : 'bg-rose-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  storageMode === 'cloud' ? 'bg-white' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span>Web Server</span>
          </button>
        </div>
      </div>

      {/* Mode Notification Banner with Remaining Operations */}
      <div
        className={`mt-4 p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          storageMode === 'local'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {storageMode === 'local' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Server className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>
            {storageMode === 'local' ? (
              <strong>Local Sandbox Active:</strong>
            ) : (
              <strong>Web Server Active ({subStatus.storageQuotaMB} MB):</strong>
            )}{' '}
            {storageMode === 'local'
              ? 'Zero server upload. All photo scrubbing is performed in browser memory.'
              : 'Synced to your cloud vault and auto-cleans based on retention policy.'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/50 font-mono font-bold text-[11px]">
            Today&apos;s Quota: {dailyLimits.remaining}/{dailyLimits.limit} left
          </span>
          <button
            onClick={() => onChangeStorageMode(storageMode === 'local' ? 'cloud' : 'local')}
            className="text-xs font-bold underline cursor-pointer hover:opacity-80"
          >
            Switch to {storageMode === 'local' ? 'Web Server' : 'Local Sandbox'}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TABS NAVIGATION BAR */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-slate-200 dark:border-neutral-800 text-xs font-bold scrollbar-none">
        {[
          { id: 'profile', label: 'User Profile & Avatar', icon: User },
          { id: 'storage', label: `${subStatus.storageQuotaMB} MB Storage & Pro`, icon: HardDrive },
          { id: 'privacy', label: 'Scrubbing Preferences', icon: Shield },
          { id: 'theme', label: 'Appearance & Theme', icon: Moon },
          { id: 'data', label: 'Vault Data & Reset', icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PROFILE & AVATAR EDITING */}
      {/* ============================================================== */}
      {activeSubTab === 'profile' && (
        <div className="py-6 space-y-8 animate-in fade-in-50">
          {!user ? (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Guest Session
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                Sign in to edit your profile, set a personalized avatar photo, and change your password.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card: Display Name & Avatar Customizer */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                <div>
                  {/* Current Avatar with Upload Button */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative group">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                        title="Upload Avatar Photo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {user.displayName || 'CleanMeta User'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload photo from device</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Avatar Picker */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Or Pick a Preset Avatar:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Preset ${i}`}
                          onClick={() => setAvatarUrl(url)}
                          className={`w-9 h-9 rounded-xl object-cover cursor-pointer border-2 transition hover:scale-110 ${
                            avatarUrl === url ? 'border-blue-600 scale-105' : 'border-transparent opacity-75'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {profileMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          profileMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200'
                        }`}
                      >
                        {profileMessage.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{profileMessage.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile & Avatar'}</span>
                    </button>
                  </form>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">UID: {user.uid.substring(0, 12)}...</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Email Change Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Change Email Address
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">
                    Update the primary email linked to your account. You will need your current password to authorize email changes.
                  </p>

                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="new-email@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Current Password (Required)
                      </label>
                      <input
                        type="password"
                        value={currentPasswordForEmail}
                        onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {emailMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          emailMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200'
                        }`}
                      >
                        {emailMessage.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{emailMessage.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingEmail}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isUpdatingEmail ? 'Updating Email...' : 'Update Email'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Password Change Card (Full Width) */}
              <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Change Account Password
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">
                  Ensure your account is protected with a strong password (minimum 6 characters).
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Confirm New
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isUpdatingPassword ? 'Updating...' : 'Change Password'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STORAGE QUOTA, RETENTION & VOUCHER REDEEM */}
      {/* ============================================================== */}
      {activeSubTab === 'storage' && (
        <div className="py-6 space-y-6 animate-in fade-in-50">
          {/* Storage Quota Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Cloud Storage Quota</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs font-mono font-bold">
                      {subStatus.storageQuotaMB} MB Allocated
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {subStatus.isPro ? 'Pro plan 200 MB quota active.' : 'Free tier (50 MB per account).'}
                  </p>
                </div>
              </div>

              <button
                onClick={refreshStorage}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Meter</span>
              </button>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  {storageUsage.usedFormatted} used of {storageUsage.totalFormatted}
                </span>
                <span className="text-blue-600 font-bold">{usagePercentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercentage > 85 ? 'bg-rose-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(2, usagePercentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Vault Files: {vaultFiles.length}</span>
                <span>Max Single File: 25 MB</span>
              </div>
            </div>

            {purgedCountNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{purgedCountNotice}</span>
              </div>
            )}
          </div>

          {/* Retention Period Picker with "No Save / Ephemeral" Option */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cloud History Auto-Retention Policy
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Select how long processed photos remain in your cloud vault before self-destructing, or select &quot;No Save&quot;.
                </p>
              </div>
            </div>

            {/* RETENTION SELECTOR (Including No Save) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {[
                { id: 'none', label: 'No Save (0 Storage)', desc: 'Never saved to server' },
                { id: '3hours', label: '3 Hours (Min)', desc: 'Quick ephemeral' },
                { id: '6hours', label: '6 Hours', desc: 'Short session' },
                { id: '12hours', label: '12 Hours', desc: 'Half day' },
                { id: '24hours', label: '24 Hours (1 Day)', desc: 'Standard vault' },
                { id: '48hours', label: '48 Hours (2 Days)', desc: 'Max lifespan' },
              ].map((item) => {
                const isSelected = retentionPreference === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeRetentionPreference(item.id as RetentionPreference)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-blue-600 mt-2 block">
                        ✓ Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRO VOUCHER REDEEM CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 dark:from-neutral-900/90 dark:via-[#0a0a0a] dark:to-neutral-900/80 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Redeem Pro Voucher / Access Code
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Enter your activation code from the founder to unlock 200 MB storage and 100 operations/day.
                </p>
              </div>

              <form onSubmit={handleRedeemVoucher} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Code: CLEANMETA-PRO-2026"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-xs font-mono font-bold uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-full sm:w-56"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition cursor-pointer shadow-xs"
                >
                  Redeem
                </button>
              </form>
            </div>

            {promoMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  promoMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {promoMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{promoMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PRIVACY & SCRUBBING PREFERENCES */}
      {/* ============================================================== */}
      {activeSubTab === 'privacy' && (
        <div className="py-6 space-y-6 animate-in fade-in-50">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Metadata Scrubbing Rules &amp; Quality
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Customize which metadata chunks to wipe automatically during one-click cleaning.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Purge GPS Coordinates & Altitude',
                  desc: 'Completely strips latitude, longitude, altitude, and location name tags.',
                  state: stripGps,
                  setter: setStripGps,
                  icon: MapPinOff,
                },
                {
                  label: 'Purge Camera Hardware & Serial Numbers',
                  desc: 'Wipes camera make, model, lens profile, shutter count, and device serials.',
                  state: stripExif,
                  setter: setStripExif,
                  icon: Camera,
                },
                {
                  label: 'Purge AI Prompt & Generation Metadata',
                  desc: 'Removes embedded Midjourney/Stable Diffusion/DALL-E prompt parameters and seed tags.',
                  state: stripAiTags,
                  setter: setStripAiTags,
                  icon: Cpu,
                },
                {
                  label: 'Preserve Standard sRGB Color Profile',
                  desc: 'Ensures output colors match the original without discoloration or tint shift.',
                  state: preserveSrgb,
                  setter: setPreserveSrgb,
                  icon: Sparkles,
                },
              ].map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <div
                    key={i}
                    onClick={() => opt.setter(!opt.state)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {opt.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center ${
                        opt.state ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-neutral-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Default Clean Format Preference */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Default Output Image Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'auto', label: 'Auto (Original)' },
                  { id: 'jpeg', label: 'JPG / JPEG' },
                  { id: 'png', label: 'PNG (Lossless)' },
                  { id: 'webp', label: 'WebP (Modern)' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => onChangeFormatPreference(fmt.id as CleanFormatPreference)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formatPreference === fmt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: APPEARANCE & THEME */}
      {/* ============================================================== */}
      {activeSubTab === 'theme' && (
        <div className="py-6 space-y-6 animate-in fade-in-50">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Color Theme &amp; Visual Style
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Choose between high-contrast Pure Black Dark Mode (#000000) and Crisp Light Mode.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  !darkMode
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Light Theme</h4>
                  <p className="text-xs text-slate-500">Crisp white background with soft borders</p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  darkMode
                    ? 'border-blue-600 bg-blue-950/60 text-white shadow-sm'
                    : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-cyan-400 flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Pure Black Dark Theme</h4>
                  <p className="text-xs text-neutral-400">Deep OLED black (#000000) styling</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: VAULT DATA & DANGER ZONE */}
      {/* ============================================================== */}
      {activeSubTab === 'data' && (
        <div className="py-6 space-y-6 animate-in fade-in-50">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-rose-200 dark:border-rose-950/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-base text-rose-700 dark:text-rose-400">
                Data Management &amp; Cache Cleanup
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              CleanMeta values complete privacy. You can purge all cached items, local history, and temporary blobs at any moment with zero residual traces.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onClearLocalVault();
                  refreshStorage();
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 text-left transition cursor-pointer flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Clear Local Browser Cache
                  </h4>
                  <p className="text-[11px] text-slate-400">Wipes in-memory object URLs and photo queue</p>
                </div>
              </button>

              <button
                onClick={() => {
                  clearEntireVault();
                  refreshStorage();
                }}
                className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition cursor-pointer flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400">
                    Purge All Cloud Vault Storage
                  </h4>
                  <p className="text-[11px] text-rose-500/80">Deletes all saved vault items immediately</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
