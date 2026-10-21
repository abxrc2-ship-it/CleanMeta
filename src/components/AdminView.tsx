import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Users,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Trash2,
  Ban,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  DollarSign,
  MessageSquare,
  LogOut,
  Mail,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  getCustomLicenseKeys,
  generateCustomLicenseKey,
  revokeCustomLicenseKey,
  deleteCustomLicenseKey,
  getAdminPasscode,
  setAdminPasscode,
  verifyAdminAccess,
  DynamicLicenseKey,
  ADMIN_EMAIL,
  UserSubscriptionTier,
} from '../lib/subscription';

interface AdminViewProps {
  user: UserProfile | null;
  onOpenAuth?: () => void;
  onNavigateHome?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  onOpenAuth,
  onNavigateHome,
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    // Check if session stored or user matches admin email
    if (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    return sessionStorage.getItem('cleanmeta_admin_auth') === 'true';
  });

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Key generator state
  const [quotaMB, setQuotaMB] = useState<number>(200);
  const [customQuotaInput, setCustomQuotaInput] = useState<string>('');
  const [tier, setTier] = useState<UserSubscriptionTier>('pro');
  const [customerNote, setCustomerNote] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dailyLimit, setDailyLimit] = useState<number>(100);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<DynamicLicenseKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedDispatch, setCopiedDispatch] = useState(false);

  // Table state
  const [keysList, setKeysList] = useState<DynamicLicenseKey[]>(() => getCustomLicenseKeys());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'redeemed' | 'revoked'>('all');

  // Security config
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);

  useEffect(() => {
    if (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setIsAuthorized(true);
      sessionStorage.setItem('cleanmeta_admin_auth', 'true');
    }
  }, [user]);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (verifyAdminAccess(passcodeInput, user?.email)) {
      setIsAuthorized(true);
      sessionStorage.setItem('cleanmeta_admin_auth', 'true');
      setPasscodeInput('');
    } else {
      setAuthError('Invalid administrator passcode. (Default: admin2026)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cleanmeta_admin_auth');
    setIsAuthorized(false);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const targetQuota = customQuotaInput ? parseInt(customQuotaInput, 10) || quotaMB : quotaMB;

    const created = generateCustomLicenseKey({
      quotaMB: targetQuota,
      tier,
      note: customerNote || `${targetQuota} MB Customer Voucher`,
      dailyLimit,
      customerEmail: customerEmail.trim() || undefined,
    });

    setNewlyCreatedKey(created);
    setKeysList(getCustomLicenseKeys());
    setCustomerNote('');
    setCustomerEmail('');
  };

  const handleRevoke = (code: string) => {
    if (window.confirm(`Revoke license key ${code}? The user will no longer be able to redeem it.`)) {
      revokeCustomLicenseKey(code);
      setKeysList(getCustomLicenseKeys());
    }
  };

  const handleDelete = (code: string) => {
    if (window.confirm(`Permanently remove key ${code} from registry?`)) {
      deleteCustomLicenseKey(code);
      setKeysList(getCustomLicenseKeys());
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyDispatch = (key: DynamicLicenseKey) => {
    const message = `Hello! Thank you for your payment. Here is your CleanMeta Pro access code:\n\nKey: ${key.code}\nAllocation: ${key.storageQuotaMB} MB Cloud Storage\n\nTo activate, go to CleanMeta (cleanmeta.app) > Pricing > Redeem Voucher, paste this code, and click Activate!`;
    navigator.clipboard.writeText(message);
    setCopiedDispatch(true);
    setTimeout(() => setCopiedDispatch(false), 2500);
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) return;
    setAdminPasscode(newPasscode);
    setPasscodeSuccess(true);
    setNewPasscode('');
    setTimeout(() => setPasscodeSuccess(false), 3000);
  };

  // Filtered keys
  const filteredKeys = keysList.filter((k) => {
    const matchesSearch =
      k.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.note && k.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.customerEmail && k.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return !k.isRedeemed && !k.isRevoked;
    if (filterStatus === 'redeemed') return k.isRedeemed;
    if (filterStatus === 'revoked') return k.isRevoked;
    return true;
  });

  const totalAllocatedMB = keysList.reduce((acc, k) => acc + (k.storageQuotaMB || 0), 0);
  const activeCount = keysList.filter((k) => !k.isRedeemed && !k.isRevoked).length;
  const redeemedCount = keysList.filter((k) => k.isRedeemed).length;

  // Render Gate if not authorized
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xl text-left">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-400 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Admin Portal Authentication
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-6 leading-relaxed">
          This restricted console allows the owner to issue custom vouchers, configure storage quotas, and manage subscription licenses.
        </p>

        {user?.email ? (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs flex items-center justify-between">
            <span className="text-slate-500">Signed in as:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.email}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full mb-4 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>Sign In with Owner Account ({ADMIN_EMAIL})</span>
          </button>
        )}

        <form onSubmit={handleAuthorize} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Admin Master Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="Enter master passcode (default: admin2026)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            <span>Access Administrator Dashboard</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Admin Control Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px] uppercase">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Issue custom storage allocations (200MB, 500MB, 1GB), manage vouchers, and track subscriptions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Keys Issued</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{keysList.length}</p>
          <span className="text-[10px] text-slate-400">Lifetime Generated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Unredeemed</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
          <span className="text-[10px] text-slate-400">Ready for Customers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Redeemed Customers</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-cyan-400 mt-1">{redeemedCount}</p>
          <span className="text-[10px] text-slate-400">Subscribers Activated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Allocated Quota Pool</span>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
            {totalAllocatedMB >= 1024 ? `${(totalAllocatedMB / 1024).toFixed(1)} GB` : `${totalAllocatedMB} MB`}
          </p>
          <span className="text-[10px] text-slate-400">Max Potential Usage</span>
        </div>
      </div>

      {/* SECTION 1: CUSTOM LICENSE KEY GENERATOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Issue Custom Subscription Voucher
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Generate a unique access key tailored to customer requirements (e.g. 200 MB, 500 MB, 1 GB).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
            Instant Activation Ready
          </span>
        </div>

        <form onSubmit={handleGenerateKey} className="space-y-5">
          {/* Preset Quota Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Select Cloud Storage Quota:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { mb: 200, label: '200 MB', tag: 'Pro Standard', tier: 'pro' },
                { mb: 500, label: '500 MB', tag: 'Power User', tier: 'pro' },
                { mb: 1024, label: '1,024 MB (1 GB)', tag: 'Founder / Ultra', tier: 'founder' },
                { mb: 0, label: 'Custom MB', tag: 'Arbitrary Quota', tier: 'custom' },
              ].map((opt) => {
                const isSelected = opt.mb === 0 ? Boolean(customQuotaInput) : quotaMB === opt.mb && !customQuotaInput;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      if (opt.mb === 0) {
                        setCustomQuotaInput('300');
                      } else {
                        setQuotaMB(opt.mb);
                        setCustomQuotaInput('');
                        setTier(opt.tier as UserSubscriptionTier);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-cyan-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-sm">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom MB input if chosen */}
          {customQuotaInput && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Specify Custom Storage Quota (in MB):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  value={customQuotaInput}
                  onChange={(e) => setCustomQuotaInput(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-300 dark:border-indigo-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs font-mono font-bold text-slate-500">MB</span>
              </div>
            </div>
          )}

          {/* Details Row: Customer Name, Email, Daily Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Customer Reference / Trx Note
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe (Trx 9X82...)"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                placeholder="customer@domain.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Daily Operations Limit
              </label>
              <select
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value={50}>50 photos / day</option>
                <option value={100}>100 photos / day (Standard Pro)</option>
                <option value={250}>250 photos / day (Heavy User)</option>
                <option value={1000}>1,000 photos / day (Unlimited)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Customer License Key</span>
            </button>
          </div>
        </form>

        {/* Newly Created Key Card */}
        {newlyCreatedKey && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  New License Key Generated:
                </span>
                <code className="text-base sm:text-lg font-mono font-black text-emerald-950 dark:text-emerald-100">
                  {newlyCreatedKey.code}
                </code>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Quota: <strong>{newlyCreatedKey.storageQuotaMB} MB</strong> • Limit: {newlyCreatedKey.dailyLimit} ops/day • Note: {newlyCreatedKey.note}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(newlyCreatedKey.code)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? 'Code Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyDispatch(newlyCreatedKey)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy ready-to-send dispatch message for WhatsApp/SMS/Email"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{copiedDispatch ? 'Message Copied!' : 'Copy Customer Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LICENSE KEYS DIRECTORY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
              Issued Keys &amp; Customer Vouchers Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Manage all generated codes, track redemptions, and revoke fraudulent or unpaid keys.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search keys, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white w-48 sm:w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses ({keysList.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="redeemed">Redeemed ({redeemedCount})</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {filteredKeys.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No matching license keys found. Generate a new voucher above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-900/80 border-b border-slate-200 dark:border-neutral-800 text-slate-500 font-bold">
                <tr>
                  <th className="p-3.5">License Key Code</th>
                  <th className="p-3.5">Quota</th>
                  <th className="p-3.5">Customer / Reference Note</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {filteredKeys.map((k) => {
                  const dateStr = new Date(k.createdAt).toLocaleDateString();
                  return (
                    <tr key={k.code} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{k.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(k.code)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Copy code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-cyan-400">
                        {k.storageQuotaMB} MB
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-neutral-300">
                        <span>{k.note || '—'}</span>
                        {k.customerEmail && (
                          <span className="block text-[10px] text-slate-400">{k.customerEmail}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{dateStr}</td>
                      <td className="p-3.5">
                        {k.isRevoked ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] uppercase">
                            Revoked
                          </span>
                        ) : k.isRedeemed ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-bold text-[10px] uppercase">
                            Redeemed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyDispatch(k)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 transition"
                            title="Copy customer dispatch message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {!k.isRevoked && !k.isRedeemed && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(k.code)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 text-rose-600 transition"
                              title="Revoke license"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(k.code)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: ADMIN SECURITY & PASSCODE SETTINGS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Security &amp; Master Passcode</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Current: {getAdminPasscode()}</span>
        </div>

        <form onSubmit={handleUpdatePasscode} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Set new administrator master passcode..."
            value={newPasscode}
            onChange={(e) => setNewPasscode(e.target.value)}
            className="w-full sm:flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
          >
            Update Passcode
          </button>
        </form>

        {passcodeSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Master administrator passcode updated successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};
