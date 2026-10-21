import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  Cloud,
  Clock,
  HardDrive,
  Lock,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  getUserSubscription,
  redeemPromoCode,
  resetSubscriptionToFree,
  SubscriptionStatus,
} from '../lib/subscription';

interface PricingViewProps {
  onNavigate?: (tab: any) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onNavigate }) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>(() => getUserSubscription());

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMessage(null);

    if (!promoInput.trim()) {
      setPromoMessage({ type: 'error', text: 'Please enter a valid voucher or license code.' });
      return;
    }

    const res = redeemPromoCode(promoInput);
    if (res.success && res.status) {
      setSubStatus(res.status);
      setPromoMessage({ type: 'success', text: res.message });
      setPromoInput('');
    } else {
      setPromoMessage({ type: 'error', text: res.message });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset subscription to Standard Free Tier for testing?')) {
      resetSubscriptionToFree();
      setSubStatus(getUserSubscription());
      setPromoMessage(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left space-y-10">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-cyan-400 text-xs font-semibold mb-3">
          <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Storage Allocations &amp; Subscription Tiers</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Transparent &amp; Fair <span className="text-blue-600 dark:text-cyan-400">Privacy Pricing</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Free accounts enjoy 50 MB Cloud Storage and unlimited 100% in-browser offline processing. Pro access is currently in private rollout, activated exclusively via administrator vouchers.
        </p>
      </div>

      {/* ACTIVE SUBSCRIPTION BADGE (IF PRO OR FOUNDER) */}
      {subStatus.isPro && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <span>{subStatus.isFounder ? 'Founder VIP Access Active' : 'Pro Subscription Active'}</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[10px] font-black uppercase">
                  {subStatus.storageQuotaMB} MB
                </span>
              </h4>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                Your account is unlocked with {subStatus.storageQuotaMB} MB Cloud Storage and {subStatus.dailyLimit || 100} daily priority operations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[11px] uppercase tracking-wider">
              Active Tier
            </span>
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-rose-500 underline ml-2 cursor-pointer"
              title="Reset to free tier for testing"
            >
              Reset to Free
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid (Free vs Pro Coming Soon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
        {/* FREE PLAN (50 MB CLOUD) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Standard Tier
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Forever Free
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-500">/ forever</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Every user receives 50 MB Cloud Storage with complete client-side processing privacy.
            </p>

            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>50 MB</strong> Cloud Storage Vault (Per Account)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>10 Photos / Day</strong> Local Sandbox Processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>5 Photos / Day</strong> Cloud Server Processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>3-Hour to 2-Day Automated File Self-Destruct Timers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Access to All 7 Image Tools &amp; 14 PDF Utilities</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              {!subStatus.isPro ? 'Current Active Plan' : 'Free Baseline'}
            </button>
          </div>
        </div>

        {/* PRO CLOUD VAULT (COMING SOON WITH REDEEM VOUCHER) */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a0a0a] border-2 border-slate-300 dark:border-neutral-700 shadow-md flex flex-col justify-between">
          {/* Top Coming Soon Tag */}
          <div className="absolute -top-3 right-6 px-3.5 py-1 rounded-full bg-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Coming Soon • Private Beta</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Pro Cloud Vault
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                Voucher Invite Only
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">$9</span>
              <span className="text-xs text-slate-500">/ month (Public Launch Soon)</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Designed for power users and teams requiring 200 MB to 1 GB cloud storage with high-speed priority queues.
            </p>

            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet-600 dark:text-cyan-400 shrink-0" />
                <span><strong>200 MB to 1 GB</strong> Extended Cloud Vault Storage</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet-600 dark:text-cyan-400 shrink-0" />
                <span><strong>100+ Photos / Day</strong> High-Speed Priority Processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet-600 dark:text-cyan-400 shrink-0" />
                <span>Multi-Device Sync &amp; Bulk ZIP Archives</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet-600 dark:text-cyan-400 shrink-0" />
                <span>Incognito 0h Option with Zero Bytes Server Retention</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet-600 dark:text-cyan-400 shrink-0" />
                <span>Private Early Access to Upcoming Video Utilities</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <a
              href="#redeem"
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Redeem Invitation / License Code</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VOUCHER / PROMO CODE REDEEM SECTION */}
      {/* ============================================================== */}
      <div
        id="redeem"
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/70 dark:from-neutral-900/90 dark:via-[#0a0a0a] dark:to-neutral-900/80 border border-blue-200 dark:border-neutral-800 shadow-md"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-400 text-xs font-bold">
              <Gift className="w-3.5 h-3.5" />
              <span>Have an Access Code or Voucher?</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Redeem Pro Voucher / Customer License Key
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Enter your access code (e.g. <code className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 font-mono text-blue-600 dark:text-cyan-400 font-bold">CLEANMETA-PRO-2026</code> or a custom key provided by the administrator) to instantly unlock upgraded storage.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRedeem} className="w-full md:w-auto flex-1 max-w-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Voucher / License Code..."
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white uppercase font-mono font-bold tracking-wider placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              >
                <span>Activate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {promoMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  promoMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
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
          </form>
        </div>
      </div>

      {/* ADMIN PORTAL LINK */}
      {onNavigate && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 font-semibold transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Are you the platform owner? Open Administrator Console →</span>
          </button>
        </div>
      )}
    </div>
  );
};
